import {
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
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
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email').notNull(),
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
  imageUrl: text('image_url'),
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
