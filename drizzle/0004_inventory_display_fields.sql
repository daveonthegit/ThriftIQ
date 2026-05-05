ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "swatch" text DEFAULT '#3A3A3A' NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "swatch2" text DEFAULT '#1A1A1A' NOT NULL;
