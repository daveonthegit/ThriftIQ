CREATE TABLE IF NOT EXISTS "sold_comp_caches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_query" text NOT NULL,
	"query" text NOT NULL,
	"marketplace" text DEFAULT 'ebay' NOT NULL,
	"source" text DEFAULT 'apify-ebay-sold-listings' NOT NULL,
	"raw_response" jsonb,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"newest_sold_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sold_comp_cache_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_id" uuid NOT NULL,
	"title" text NOT NULL,
	"marketplace" text DEFAULT 'ebay' NOT NULL,
	"sold_price" numeric(10, 2) NOT NULL,
	"shipping_price" numeric(10, 2),
	"sold_at" timestamp with time zone,
	"item_url" text,
	"condition" text,
	"size" text
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sold_comp_cache_items" ADD CONSTRAINT "sold_comp_cache_items_cache_id_sold_comp_caches_id_fk" FOREIGN KEY ("cache_id") REFERENCES "public"."sold_comp_caches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "sold_comp_caches_normalized_query_unique" ON "sold_comp_caches" USING btree ("normalized_query");
