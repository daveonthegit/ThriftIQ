ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_clerk_user_id_unique";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "clerk_user_id" TO "supabase_auth_id";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "supabase_auth_id" TYPE uuid USING "supabase_auth_id"::uuid;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_supabase_auth_id_unique" UNIQUE("supabase_auth_id");
