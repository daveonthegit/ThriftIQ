import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { databaseUnavailableResponse, internalErrorResponse } from '@/lib/api/errors'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { db, isDatabaseConfigured } from '@/lib/db/client'
import { comps, searches } from '@/lib/db/schema'
import { Comp, Item, findItem, stats } from '@/components/thriftiq/data'

function daysAgo(value: Date | null) {
  if (!value) {
    return 30
  }

  return Math.max(0, Math.round((Date.now() - value.getTime()) / 86_400_000))
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const [search] = await db
      .select()
      .from(searches)
      .where(and(eq(searches.id, id), eq(searches.userId, user.id)))
      .limit(1)

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    const compRows = await db
      .select()
      .from(comps)
      .where(eq(comps.searchId, search.id))

    const raw = search.rawResponse as { title?: string; source?: string } | null
    const savedComps: Comp[] = compRows.map((comp, index) => ({
      title: comp.title,
      price: Number(comp.soldPrice),
      daysAgo: daysAgo(comp.soldAt),
      condition: 'Sold',
      size: 'N/A',
      soldFast: index < 3 || daysAgo(comp.soldAt) <= 14,
      itemUrl: comp.itemUrl,
    })).filter(comp => Number.isFinite(comp.price) && comp.price > 0)

    const fallback = findItem(search.query)
    const item: Item = savedComps.length >= 3 ? {
      id: `saved-${search.id}`,
      title: raw?.title ?? savedComps[0]?.title ?? search.query,
      sub: raw?.source?.includes('apify') ? 'saved eBay sold listings' : 'saved search',
      swatch: fallback.swatch,
      swatch2: fallback.swatch2,
      comps: savedComps.sort((a, b) => a.daysAgo - b.daysAgo),
    } : fallback

    const itemStats = stats(item.comps)

    return NextResponse.json({
      item,
      search: {
        ...mapSearch(search),
        median: Math.round(itemStats.median),
        confidence: itemStats.confidence,
      },
    })
  } catch (error) {
    return internalErrorResponse(error, 'Could not load search')
  }
}
