import { desc, eq } from 'drizzle-orm'
import { Item } from '@/components/thriftiq/data'
import { db } from '@/lib/db/client'
import { soldCompCacheItems, soldCompCaches } from '@/lib/db/schema'
import { EbaySoldComp, EbaySoldCompsResult } from './ebay-sold-listings'

const DEFAULT_CACHE_TTL_HOURS = 6

export type CachedSoldCompsResult = EbaySoldCompsResult & {
  cacheStatus: 'hit' | 'stale'
  cacheFetchedAt: Date
}

export function normalizeSoldCompsQuery(query: string) {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
}

function cacheTtlMs() {
  const configured = Number(process.env.APIFY_CACHE_TTL_HOURS)
  const hours = Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_CACHE_TTL_HOURS

  return hours * 60 * 60 * 1000
}

function daysAgo(date: Date | null) {
  if (!date) {
    return 30
  }

  return Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000))
}

function cacheRowsToResult(
  query: string,
  cache: typeof soldCompCaches.$inferSelect,
  rows: Array<typeof soldCompCacheItems.$inferSelect>,
  cacheStatus: 'hit' | 'stale',
): CachedSoldCompsResult | null {
  const comps = rows
    .map((row, index): EbaySoldComp => ({
      title: row.title,
      price: Number(row.soldPrice),
      daysAgo: daysAgo(row.soldAt),
      condition: row.condition ?? 'Sold',
      size: row.size ?? 'N/A',
      soldFast: index < 3 || daysAgo(row.soldAt) <= 14,
      itemUrl: row.itemUrl,
      soldAt: row.soldAt,
      shippingPrice: row.shippingPrice === null ? null : Number(row.shippingPrice),
    }))
    .filter(comp => Number.isFinite(comp.price) && comp.price > 0)

  if (comps.length < 3) {
    return null
  }

  const item: Item = {
    id: `cache-${cache.normalizedQuery.replace(/\s+/g, '-')}`,
    title: comps[0]?.title ?? query,
    sub: 'cached eBay sold listings',
    swatch: '#3A3A3A',
    swatch2: '#1A1A1A',
    comps,
  }

  return {
    item,
    comps,
    raw: Array.isArray(cache.rawResponse) ? cache.rawResponse : [],
    cacheStatus,
    cacheFetchedAt: cache.fetchedAt,
  }
}

export async function getCachedEbaySoldListings(query: string, options: { allowStale?: boolean } = {}) {
  const normalizedQuery = normalizeSoldCompsQuery(query)

  if (!normalizedQuery) {
    return null
  }

  const [cache] = await db
    .select()
    .from(soldCompCaches)
    .where(eq(soldCompCaches.normalizedQuery, normalizedQuery))
    .limit(1)

  if (!cache) {
    return null
  }

  const isFresh = Date.now() - cache.fetchedAt.getTime() < cacheTtlMs()

  if (!isFresh && !options.allowStale) {
    return null
  }

  const rows = await db
    .select()
    .from(soldCompCacheItems)
    .where(eq(soldCompCacheItems.cacheId, cache.id))
    .orderBy(desc(soldCompCacheItems.soldAt))
    .limit(20)

  return cacheRowsToResult(query, cache, rows, isFresh ? 'hit' : 'stale')
}

export async function storeEbaySoldListings(query: string, result: EbaySoldCompsResult) {
  const normalizedQuery = normalizeSoldCompsQuery(query)

  if (!normalizedQuery) {
    return
  }

  const newestSoldAt = result.comps.reduce<Date | null>((newest, comp) => {
    if (!comp.soldAt) {
      return newest
    }

    if (!newest || comp.soldAt.getTime() > newest.getTime()) {
      return comp.soldAt
    }

    return newest
  }, null)

  const [cache] = await db
    .insert(soldCompCaches)
    .values({
      normalizedQuery,
      query,
      rawResponse: result.raw,
      fetchedAt: new Date(),
      newestSoldAt,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: soldCompCaches.normalizedQuery,
      set: {
        query,
        rawResponse: result.raw,
        fetchedAt: new Date(),
        newestSoldAt,
        updatedAt: new Date(),
      },
    })
    .returning()

  await db
    .delete(soldCompCacheItems)
    .where(eq(soldCompCacheItems.cacheId, cache.id))

  await db.insert(soldCompCacheItems).values(result.comps.slice(0, 20).map(comp => ({
    cacheId: cache.id,
    title: comp.title,
    marketplace: 'ebay',
    soldPrice: String(comp.price),
    shippingPrice: comp.shippingPrice === null ? null : String(comp.shippingPrice),
    soldAt: comp.soldAt,
    itemUrl: comp.itemUrl,
    condition: comp.condition,
    size: comp.size,
  })))
}
