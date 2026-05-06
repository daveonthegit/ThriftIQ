import { Comp, Item } from '@/components/thriftiq/data'

const ACTOR_ID = 'caffein.dev~ebay-sold-listings'
const ACTOR_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`

type ApifySoldListing = {
  title?: string | null
  url?: string | null
  endedAt?: string | null
  soldPrice?: string | number | null
  shippingPrice?: string | number | null
  condition?: string | null
  itemId?: string | null
  image?: string | null
  imageUrl?: string | null
  imageURL?: string | null
  thumbnail?: string | null
  thumbnailUrl?: string | null
  galleryURL?: string | null
  pictureURL?: string | null
  images?: Array<string | { url?: string | null }> | null
  pictureUrls?: Array<string | { url?: string | null }> | null
}

export type EbaySoldComp = Comp & {
  title: string
  itemUrl: string | null
  imageUrl: string | null
  soldAt: Date | null
  shippingPrice: number | null
}

export type EbaySoldCompsResult = {
  item: Item
  comps: EbaySoldComp[]
  raw: ApifySoldListing[]
}

function parseMoney(value: string | number | null | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (!value) {
    return null
  }

  const parsed = Number(value.replace(/[^0-9.-]/g, ''))

  return Number.isFinite(parsed) ? parsed : null
}

function daysAgo(value: string | null | undefined) {
  if (!value) {
    return 30
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 30
  }

  return Math.max(0, Math.round((Date.now() - date.getTime()) / 86_400_000))
}

function soldAt(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function asImageUrl(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  if (!/^https?:\/\//i.test(trimmed)) {
    return null
  }

  return trimmed
}

function imageFromCollection(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null
  }

  for (const entry of value) {
    const direct = asImageUrl(entry)

    if (direct) {
      return direct
    }

    if (entry && typeof entry === 'object' && 'url' in entry) {
      const nested = asImageUrl((entry as { url?: unknown }).url)

      if (nested) {
        return nested
      }
    }
  }

  return null
}

function listingImageUrl(listing: ApifySoldListing) {
  return (
    asImageUrl(listing.imageUrl) ||
    asImageUrl(listing.imageURL) ||
    asImageUrl(listing.image) ||
    asImageUrl(listing.thumbnailUrl) ||
    asImageUrl(listing.thumbnail) ||
    asImageUrl(listing.galleryURL) ||
    asImageUrl(listing.pictureURL) ||
    imageFromCollection(listing.images) ||
    imageFromCollection(listing.pictureUrls)
  )
}

export async function fetchEbaySoldListings(query: string): Promise<EbaySoldCompsResult | null> {
  const token = process.env.APIFY_TOKEN

  if (!token) {
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 55_000)

  try {
    const response = await fetch(`${ACTOR_URL}?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        keyword: query,
        daysToScrape: 15,
        count: 20,
        ebaySite: 'ebay.com',
        sortOrder: 'endedRecently',
        itemCondition: 'any',
        currencyMode: 'USD',
        detailedSearch: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Apify eBay sold listings failed with ${response.status}`)
    }

    const raw = await response.json() as ApifySoldListing[]
    const comps = raw
      .map((listing, index): EbaySoldComp | null => {
        const price = parseMoney(listing.soldPrice)

        if (price === null || price <= 0) {
          return null
        }

        const age = daysAgo(listing.endedAt)

        return {
          title: listing.title?.trim() || query,
          price,
          daysAgo: age,
          condition: listing.condition || 'Sold',
          size: 'N/A',
          soldFast: index < 3 || age <= 14,
          itemUrl: listing.url || null,
          imageUrl: listingImageUrl(listing),
          soldAt: soldAt(listing.endedAt),
          shippingPrice: parseMoney(listing.shippingPrice),
        }
      })
      .filter((comp): comp is EbaySoldComp => Boolean(comp))
      .sort((a, b) => a.daysAgo - b.daysAgo)

    if (comps.length < 3) {
      return null
    }

    return {
      item: {
        id: `apify-${query.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'search'}`,
        title: comps[0]?.title ?? query,
        sub: 'eBay sold listings',
        swatch: '#3A3A3A',
        swatch2: '#1A1A1A',
        comps,
        imageUrl: comps.find(comp => comp.imageUrl)?.imageUrl ?? null,
      },
      comps,
      raw,
    }
  } finally {
    clearTimeout(timeout)
  }
}
