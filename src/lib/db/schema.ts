import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const inventoryStatus = pgEnum('inventory_status', [
  'sourced',
  'listed',
  'sold',
  'archived',
])

export const recommendation = pgEnum('recommendation', ['buy', 'skip', 'watch'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  supabaseAuthId: uuid('supabase_auth_id').notNull().unique(),
  email: text('email').notNull(),
  username: text('username').notNull().unique(),
  plan: text('plan').notNull().default('Free'),
  searchLimit: integer('search_limit').notNull().default(10),
  unlimitedSearches: integer('unlimited_searches').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const searches = pgTable('searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  query: text('query').notNull(),
  marketplace: text('marketplace').notNull().default('ebay'),
  rawResponse: jsonb('raw_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const comps = pgTable('comps', {
  id: uuid('id').primaryKey().defaultRandom(),
  searchId: uuid('search_id')
    .notNull()
    .references(() => searches.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  marketplace: text('marketplace').notNull().default('ebay'),
  soldPrice: numeric('sold_price', { precision: 10, scale: 2 }).notNull(),
  shippingPrice: numeric('shipping_price', { precision: 10, scale: 2 }),
  soldAt: timestamp('sold_at', { withTimezone: true }),
  itemUrl: text('item_url'),
})

export const soldCompCaches = pgTable('sold_comp_caches', {
  id: uuid('id').primaryKey().defaultRandom(),
  normalizedQuery: text('normalized_query').notNull(),
  query: text('query').notNull(),
  marketplace: text('marketplace').notNull().default('ebay'),
  source: text('source').notNull().default('apify-ebay-sold-listings'),
  rawResponse: jsonb('raw_response'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  newestSoldAt: timestamp('newest_sold_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => ({
  normalizedQueryUnique: uniqueIndex('sold_comp_caches_normalized_query_unique').on(table.normalizedQuery),
}))

export const soldCompCacheItems = pgTable('sold_comp_cache_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cacheId: uuid('cache_id')
    .notNull()
    .references(() => soldCompCaches.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  marketplace: text('marketplace').notNull().default('ebay'),
  soldPrice: numeric('sold_price', { precision: 10, scale: 2 }).notNull(),
  shippingPrice: numeric('shipping_price', { precision: 10, scale: 2 }),
  soldAt: timestamp('sold_at', { withTimezone: true }),
  itemUrl: text('item_url'),
  condition: text('condition'),
  size: text('size'),
})

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  searchId: uuid('search_id').references(() => searches.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  itemCost: numeric('item_cost', { precision: 10, scale: 2 }).notNull(),
  targetListPrice: numeric('target_list_price', { precision: 10, scale: 2 }),
  estimatedProfit: numeric('estimated_profit', { precision: 10, scale: 2 }),
  estimatedMarginBps: integer('estimated_margin_bps'),
  recommendation: recommendation('recommendation').notNull().default('watch'),
  status: inventoryStatus('status').notNull().default('sourced'),
  receiptImagePath: text('receipt_image_path'),
  swatch: text('swatch').notNull().default('#3A3A3A'),
  swatch2: text('swatch2').notNull().default('#1A1A1A'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const listingDrafts = pgTable('listing_drafts', {
  id: uuid('id').primaryKey().defaultRandom(),
  inventoryItemId: uuid('inventory_item_id')
    .notNull()
    .references(() => inventoryItems.id, { onDelete: 'cascade' }),
  marketplace: text('marketplace').notNull().default('ebay'),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }),
  generatedBy: text('generated_by').notNull().default('ai'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
