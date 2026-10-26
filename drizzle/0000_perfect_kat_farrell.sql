CREATE TYPE "public"."critic_review_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."locale" AS ENUM('pt', 'en');--> statement-breakpoint
CREATE TYPE "public"."play_status" AS ENUM('playing', 'finished', 'wishlist', 'dropped');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('open', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."report_target" AS ENUM('user_review', 'comment');--> statement-breakpoint
CREATE TYPE "public"."review_kind" AS ENUM('critic', 'user');--> statement-breakpoint
CREATE TYPE "public"."studio_role" AS ENUM('developer', 'publisher');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'critic', 'editor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."visibility" AS ENUM('visible', 'hidden');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_kind" "review_kind" NOT NULL,
	"review_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"visibility" "visibility" DEFAULT 'visible' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "critic_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"slug" text NOT NULL,
	"locale" "locale" DEFAULT 'pt' NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"body" jsonb,
	"score" real,
	"pros" text[] DEFAULT '{}'::text[] NOT NULL,
	"cons" text[] DEFAULT '{}'::text[] NOT NULL,
	"platform_tested_id" integer,
	"status" "critic_review_status" DEFAULT 'draft' NOT NULL,
	"editor_id" text,
	"editor_note" text,
	"submitted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "critic_reviews_slug_unique" UNIQUE("slug"),
	CONSTRAINT "critic_reviews_score_ck" CHECK ("critic_reviews"."score" >= 0 and "critic_reviews"."score" <= 10 and mod(("critic_reviews"."score" * 2)::numeric, 1) = 0)
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"follower_id" text NOT NULL,
	"following_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id"),
	CONSTRAINT "follows_not_self_ck" CHECK ("follows"."follower_id" <> "follows"."following_id")
);
--> statement-breakpoint
CREATE TABLE "game_genres" (
	"game_id" uuid NOT NULL,
	"genre_id" integer NOT NULL,
	CONSTRAINT "game_genres_game_id_genre_id_pk" PRIMARY KEY("game_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "game_platforms" (
	"game_id" uuid NOT NULL,
	"platform_id" integer NOT NULL,
	CONSTRAINT "game_platforms_game_id_platform_id_pk" PRIMARY KEY("game_id","platform_id")
);
--> statement-breakpoint
CREATE TABLE "game_statuses" (
	"user_id" text NOT NULL,
	"game_id" uuid NOT NULL,
	"status" "play_status" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "game_statuses_user_id_game_id_pk" PRIMARY KEY("user_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "game_studios" (
	"game_id" uuid NOT NULL,
	"studio_id" integer NOT NULL,
	"role" "studio_role" NOT NULL,
	CONSTRAINT "game_studios_game_id_studio_id_role_pk" PRIMARY KEY("game_id","studio_id","role")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"igdb_id" integer,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"cover_url" text,
	"release_date" date,
	"critic_score" real,
	"critic_count" integer DEFAULT 0 NOT NULL,
	"user_score" real,
	"user_count" integer DEFAULT 0 NOT NULL,
	"user_positive" integer DEFAULT 0 NOT NULL,
	"user_mixed" integer DEFAULT 0 NOT NULL,
	"user_negative" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_igdb_id_unique" UNIQUE("igdb_id"),
	CONSTRAINT "games_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"igdb_id" integer,
	"slug" text NOT NULL,
	"name_pt" text NOT NULL,
	"name_en" text NOT NULL,
	CONSTRAINT "genres_igdb_id_unique" UNIQUE("igdb_id"),
	CONSTRAINT "genres_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "list_items" (
	"list_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"note" text,
	CONSTRAINT "list_items_list_id_game_id_pk" PRIMARY KEY("list_id","game_id")
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platforms" (
	"id" serial PRIMARY KEY NOT NULL,
	"igdb_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	CONSTRAINT "platforms_igdb_id_unique" UNIQUE("igdb_id"),
	CONSTRAINT "platforms_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target" "report_target" NOT NULL,
	"target_id" uuid NOT NULL,
	"reporter_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" "report_status" DEFAULT 'open' NOT NULL,
	"resolved_by_id" text,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_likes" (
	"user_id" text NOT NULL,
	"review_kind" "review_kind" NOT NULL,
	"review_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_likes_user_id_review_kind_review_id_pk" PRIMARY KEY("user_id","review_kind","review_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "studios" (
	"id" serial PRIMARY KEY NOT NULL,
	"igdb_id" integer,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "studios_igdb_id_unique" UNIQUE("igdb_id"),
	CONSTRAINT "studios_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"handle" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"title" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "user_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"score" real NOT NULL,
	"body" text,
	"locale" "locale" DEFAULT 'pt' NOT NULL,
	"visibility" "visibility" DEFAULT 'visible' NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_reviews_score_ck" CHECK ("user_reviews"."score" >= 0 and "user_reviews"."score" <= 10 and mod(("user_reviews"."score" * 2)::numeric, 1) = 0)
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critic_reviews" ADD CONSTRAINT "critic_reviews_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critic_reviews" ADD CONSTRAINT "critic_reviews_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critic_reviews" ADD CONSTRAINT "critic_reviews_platform_tested_id_platforms_id_fk" FOREIGN KEY ("platform_tested_id") REFERENCES "public"."platforms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critic_reviews" ADD CONSTRAINT "critic_reviews_editor_id_user_id_fk" FOREIGN KEY ("editor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_user_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_user_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_genres" ADD CONSTRAINT "game_genres_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_platforms" ADD CONSTRAINT "game_platforms_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_platforms" ADD CONSTRAINT "game_platforms_platform_id_platforms_id_fk" FOREIGN KEY ("platform_id") REFERENCES "public"."platforms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_statuses" ADD CONSTRAINT "game_statuses_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_statuses" ADD CONSTRAINT "game_statuses_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_studios" ADD CONSTRAINT "game_studios_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_studios" ADD CONSTRAINT "game_studios_studio_id_studios_id_fk" FOREIGN KEY ("studio_id") REFERENCES "public"."studios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_items" ADD CONSTRAINT "list_items_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_reviews" ADD CONSTRAINT "user_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comments_review_idx" ON "comments" USING btree ("review_kind","review_id","created_at");--> statement-breakpoint
CREATE INDEX "critic_reviews_game_idx" ON "critic_reviews" USING btree ("game_id","status");--> statement-breakpoint
CREATE INDEX "critic_reviews_author_idx" ON "critic_reviews" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "critic_reviews_author_game_locale_uq" ON "critic_reviews" USING btree ("author_id","game_id","locale");--> statement-breakpoint
CREATE INDEX "follows_following_idx" ON "follows" USING btree ("following_id");--> statement-breakpoint
CREATE INDEX "game_genres_genre_idx" ON "game_genres" USING btree ("genre_id");--> statement-breakpoint
CREATE INDEX "game_platforms_platform_idx" ON "game_platforms" USING btree ("platform_id");--> statement-breakpoint
CREATE INDEX "game_statuses_user_status_idx" ON "game_statuses" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "game_studios_studio_idx" ON "game_studios" USING btree ("studio_id");--> statement-breakpoint
CREATE INDEX "games_release_idx" ON "games" USING btree ("release_date");--> statement-breakpoint
CREATE INDEX "games_critic_score_idx" ON "games" USING btree ("critic_score");--> statement-breakpoint
CREATE UNIQUE INDEX "lists_user_slug_uq" ON "lists" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reports_reporter_target_uq" ON "reports" USING btree ("reporter_id","target","target_id");--> statement-breakpoint
CREATE INDEX "review_likes_review_idx" ON "review_likes" USING btree ("review_kind","review_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_reviews_game_user_uq" ON "user_reviews" USING btree ("game_id","user_id");--> statement-breakpoint
CREATE INDEX "user_reviews_game_idx" ON "user_reviews" USING btree ("game_id","visibility");