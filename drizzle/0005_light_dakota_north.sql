ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "must_change_password" boolean DEFAULT false NOT NULL;