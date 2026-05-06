import { NextResponse } from 'next/server'
import { count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { databaseUnavailableResponse, internalErrorResponse } from '@/lib/api/errors'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { db, isDatabaseConfigured } from '@/lib/db/client'
import { comps, searches } from '@/lib/db/schema'
import { calcProfit, findItem, stats } from '@/components/thriftiq/data'
import { searchEntitlementFor } from '@/lib/entitlements'
import { fetchEbaySoldListings } from '@/lib/apify/ebay-sold-listings'
import { getCachedEbaySoldListings, storeEbaySoldListings } from '@/lib/apify/sold-comps-cache'

const BUY_THRESHOLD = 50

const searchSchema = z.object({
  query: z.string().trim().min(1),
})

function cacheStatusFor(result: Awaited<ReturnType<typeof getCachedEbaySoldListings>> | Awaited<ReturnType<typeof fetchEbaySoldListings>>) {
  return result && 'cacheStatus' in result ? result.cacheStatus : undefined
}

function mapSearch(row: typeof searches.$inferSelect) {
  const raw = row.rawResponse as {
    title?: string
    median?: number
    confidence?: 'High' | 'Medium' | 'Low'
    verdict?: 'BUY' | 'SKIP' | 'WATCH'
  } | null

  return {
    id: row.id,
    query: row.query,
    title: raw?.title ?? row.query,
    median: raw?.median ?? 0,
    confidence: raw?.confidence ?? 'Low',
    verdict: raw?.verdict ?? 'WATCH',
    searchedAt: row.createdAt ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((row.createdAt.getTime() - Date.now()) / 86_400_000),
      'day',
    ) : 'just now',
  }
}

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await db
      .select()
      .from(searches)
      .where(eq(searches.userId, user.id))
      .orderBy(desc(searches.createdAt))
      .limit(20)

    return NextResponse.json({ searches: rows.map(mapSearch) })
  } catch (error) {
    return internalErrorResponse(error, 'Could not load searches')
  }
}

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = searchSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid search query' }, { status: 400 })
    }

    const entitlement = searchEntitlementFor(user)

    if (!entitlement.unlimitedSearches && entitlement.searchLimit !== null) {
      const [usage] = await db
        .select({ count: count() })
        .from(searches)
        .where(eq(searches.userId, user.id))

      if ((usage?.count ?? 0) >= entitlement.searchLimit) {
        return NextResponse.json({
          error: `Free search limit reached (${entitlement.searchLimit}).`,
          code: 'SEARCH_LIMIT_REACHED',
        }, { status: 429 })
      }
    }

    const cachedResult = await getCachedEbaySoldListings(parsed.data.query)
    const apifyResult = cachedResult ?? await fetchEbaySoldListings(parsed.data.query).then(async result => {
      if (result) {
        await storeEbaySoldListings(parsed.data.query, result)
        return result
      }

      return getCachedEbaySoldListings(parsed.data.query, { allowStale: true })
    }).catch(async error => {
      console.error('Apify eBay sold listings failed; falling back to cached or seed comps.', error)
      return getCachedEbaySoldListings(parsed.data.query, { allowStale: true })
    })
    const item = apifyResult?.item ?? findItem(parsed.data.query)
    const itemStats = stats(item.comps)
    const projected = calcProfit({
      sellPrice: Math.round(itemStats.median),
      cost: Math.max(1, Math.round(itemStats.median * 0.2)),
      shipping: 12,
    })
    const verdict =
      itemStats.confidence === 'Low' ? 'WATCH' : projected.margin >= BUY_THRESHOLD ? 'BUY' : 'SKIP'

    const cacheStatus = cacheStatusFor(apifyResult)
    const rawResponse = {
      title: item.title,
      median: Math.round(itemStats.median),
      confidence: itemStats.confidence,
      verdict,
      source: cacheStatus ? 'apify-ebay-sold-listings-cache' : apifyResult ? 'apify-ebay-sold-listings' : 'seed-comps',
      cacheStatus,
      compCount: item.comps.length,
    }

    const [search] = await db
      .insert(searches)
      .values({
        userId: user.id,
        query: parsed.data.query,
        marketplace: 'ebay',
        rawResponse,
      })
      .returning()

    await db.insert(comps).values(item.comps.map((comp, index) => ({
      searchId: search.id,
      title: apifyResult?.comps[index]?.title ?? item.title,
      marketplace: 'ebay',
      soldPrice: String(comp.price),
      shippingPrice: apifyResult?.comps[index]?.shippingPrice === null ||
        apifyResult?.comps[index]?.shippingPrice === undefined
        ? null
        : String(apifyResult.comps[index].shippingPrice),
      soldAt: apifyResult?.comps[index]?.soldAt ?? new Date(Date.now() - comp.daysAgo * 86_400_000),
      itemUrl: apifyResult?.comps[index]?.itemUrl ?? null,
      imageUrl: apifyResult?.comps[index]?.imageUrl ?? comp.imageUrl ?? null,
    })))

    return NextResponse.json({
      item,
      search: mapSearch(search),
    }, { status: 201 })
  } catch (error) {
    return internalErrorResponse(error, 'Could not create search')
  }
}
