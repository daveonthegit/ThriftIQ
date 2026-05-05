ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan" text DEFAULT 'Free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "search_limit" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "unlimited_searches" integer DEFAULT 0 NOT NULL;
