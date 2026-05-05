export type Theme = 'streetwear' | 'refined' | 'terminal'
export type Accent = 'acid' | 'lime' | 'orange' | 'cyan'

export const THEMES: Record<Theme, {
  bg: string; surface: string; surface2: string; border: string; borderStrong: string;
  text: string; textMute: string; textFaint: string; skip: string; warn: string;
}> = {
  streetwear: {
    bg: '#0B0B0B', surface: '#141414', surface2: '#1C1C1C',
    border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.16)',
    text: '#F5F2EC', textMute: 'rgba(245,242,236,0.55)', textFaint: 'rgba(245,242,236,0.35)',
    skip: '#FF3B2F', warn: '#F5B544',
  },
  refined: {
    bg: '#0E0E10', surface: '#16161A', surface2: '#1E1E22',
    border: 'rgba(255,255,255,0.06)', borderStrong: 'rgba(255,255,255,0.12)',
    text: '#EDEDEA', textMute: 'rgba(237,237,234,0.5)', textFaint: 'rgba(237,237,234,0.3)',
    skip: '#E25C4D', warn: '#E0B062',
  },
  terminal: {
    bg: '#000', surface: '#0A0A0A', surface2: '#111',
    border: 'rgba(255,255,255,0.1)', borderStrong: 'rgba(255,255,255,0.2)',
    text: '#E8E8E8', textMute: 'rgba(232,232,232,0.55)', textFaint: 'rgba(232,232,232,0.32)',
    skip: '#FF5555', warn: '#FFD866',
  },
}

export const ACCENTS: Record<Accent, { hex: string; ink: string; name: string }> = {
  acid:   { hex: '#C5FF3A', ink: '#0B0B0B', name: 'Acid green' },
  lime:   { hex: '#A8FF00', ink: '#0B0B0B', name: 'Lime' },
  orange: { hex: '#FF6B2C', ink: '#FFFFFF', name: 'Hot orange' },
  cyan:   { hex: '#3CE0FF', ink: '#0B0B0B', name: 'Cyan' },
}

export const FONT_BODY = `"Inter", "Helvetica Neue", system-ui, sans-serif`
export const FONT_MONO = `"JetBrains Mono", ui-monospace, "SF Mono", monospace`
export const FONT_DISPLAY_BY_THEME: Record<Theme, string> = {
  streetwear: `"Fraunces", "Times New Roman", serif`,
  refined: `"Instrument Serif", "Times New Roman", serif`,
  terminal: `"JetBrains Mono", ui-monospace, monospace`,
}

export const TRENDING = [
  'Carhartt Detroit J97',
  'Chrome Hearts hoodie',
  'Vintage Harley tee',
  'Nike SB Dunk Low',
  'Polo Ralph Lauren rugby',
  'Stüssy world tour',
  'Patagonia Snap-T',
  "Arc'teryx Beta AR",
]

export const RECENT = ['Vintage Nike windbreaker', "Levi's 501 made in usa"]

export type Comp = {
  price: number; daysAgo: number; condition: string; size: string; soldFast: boolean
}
export type Item = {
  id: string; title: string; sub: string; swatch: string; swatch2: string; comps: Comp[]
}

function genComps(prices: number[]): Comp[] {
  const conditions = ['Pre-owned', 'Pre-owned', 'Pre-owned', 'Used', 'Like new', 'Good']
  const sizes = ['S', 'M', 'L', 'XL', 'M', 'L']
  // deterministic pseudo-random so SSR/CSR match
  return prices.map((p, i) => ({
    price: p,
    daysAgo: 2 + ((i * 13 + 7) % 78),
    condition: conditions[i % conditions.length]!,
    size: sizes[i % sizes.length]!,
    soldFast: i < 3,
  })).sort((a, b) => a.daysAgo - b.daysAgo)
}

export const ITEMS: Record<string, Omit<Item, 'id'>> = {
  'carhartt-j97': {
    title: 'Carhartt Detroit Jacket J97',
    sub: 'Workwear · Heavyweight Canvas',
    swatch: '#7B5A2A', swatch2: '#3A2A18',
    comps: genComps([88, 95, 110, 115, 118, 120, 122, 125, 128, 132, 135, 140, 145, 150, 165, 180]),
  },
  'chrome-hearts-hoodie': {
    title: 'Chrome Hearts Cross Hoodie',
    sub: 'Luxury Streetwear · Heavy',
    swatch: '#1A1A1A', swatch2: '#3D3D3D',
    comps: genComps([420, 480, 510, 540, 560, 580, 595, 610, 625, 640, 670, 695, 720, 760, 820, 980]),
  },
  'harley-tee': {
    title: 'Vintage Harley-Davidson Tee',
    sub: 'Single-stitch · 90s',
    swatch: '#FF7A1A', swatch2: '#1A1A1A',
    comps: genComps([35, 42, 48, 55, 58, 62, 65, 68, 72, 75, 78, 82, 88, 95, 110, 145]),
  },
  'sb-dunk-low': {
    title: 'Nike SB Dunk Low Travis Scott',
    sub: 'Sneakers · Size 10',
    swatch: '#7A6A4F', swatch2: '#2C2419',
    comps: genComps([1100, 1180, 1240, 1280, 1320, 1340, 1360, 1380, 1400, 1420, 1450, 1480, 1520, 1580, 1680, 1980]),
  },
  'polo-rugby': {
    title: 'Polo Ralph Lauren Rugby Shirt',
    sub: 'Heavyweight · Big Pony',
    swatch: '#1F3A6B', swatch2: '#C9302C',
    comps: genComps([28, 34, 38, 42, 45, 48, 52, 55, 58, 62, 65, 68, 72, 78, 88, 110]),
  },
  'stussy-world-tour': {
    title: 'Stüssy World Tour Tee',
    sub: 'Vintage 90s · Cotton',
    swatch: '#000', swatch2: '#C5FF3A',
    comps: genComps([55, 65, 72, 78, 82, 88, 92, 95, 98, 105, 110, 118, 125, 138, 155, 195]),
  },
}

const SEARCH_KEY: Record<string, string> = {
  carhartt: 'carhartt-j97', detroit: 'carhartt-j97', j97: 'carhartt-j97',
  chrome: 'chrome-hearts-hoodie', hearts: 'chrome-hearts-hoodie',
  harley: 'harley-tee', davidson: 'harley-tee',
  nike: 'sb-dunk-low', dunk: 'sb-dunk-low', sb: 'sb-dunk-low', travis: 'sb-dunk-low',
  polo: 'polo-rugby', ralph: 'polo-rugby', rugby: 'polo-rugby',
  stussy: 'stussy-world-tour', stüssy: 'stussy-world-tour', world: 'stussy-world-tour',
}

export function findItem(query: string): Item {
  const q = query.toLowerCase().trim()
  for (const [kw, id] of Object.entries(SEARCH_KEY)) {
    if (q.includes(kw)) return { id, ...ITEMS[id]! }
  }
  return {
    id: 'custom', title: query || 'Untitled find', sub: 'Search match',
    swatch: '#3A3A3A', swatch2: '#1A1A1A',
    comps: ITEMS['carhartt-j97']!.comps,
  }
}

export type Stats = {
  median: number; mean: number; q1: number; q3: number; iqr: number;
  min: number; max: number; n: number; confidence: 'High' | 'Medium' | 'Low'
}

export function stats(comps: Comp[]): Stats {
  const prices = comps.map(c => c.price).sort((a, b) => a - b)
  const n = prices.length
  const median = n % 2 ? prices[(n - 1) / 2]! : (prices[n / 2 - 1]! + prices[n / 2]!) / 2
  const mean = prices.reduce((a, b) => a + b, 0) / n
  const q1 = prices[Math.floor(n * 0.25)]!
  const q3 = prices[Math.floor(n * 0.75)]!
  const iqr = q3 - q1
  const min = prices[0]!, max = prices[n - 1]!
  const cv = iqr / median
  const confidence = cv > 0.45 ? 'Low' : cv > 0.28 ? 'Medium' : 'High'
  return { median, mean, q1, q3, iqr, min, max, n, confidence }
}

export function calcProfit({ sellPrice, cost, shipping }: { sellPrice: number; cost: number; shipping: number }) {
  const fee = sellPrice * 0.1325 + 0.4
  const payout = sellPrice - fee - shipping
  const profit = payout - cost
  const margin = cost > 0 ? (profit / cost) * 100 : 0
  return { fee, payout, profit, margin }
}

export type InventoryItem = {
  id: string; title: string; cost: number; est: number;
  status: 'sourced' | 'listed' | 'sold'; swatch: string; swatch2: string; date: string
}
