CREATE TABLE "list_likes" (
	"user_id" text NOT NULL,
	"list_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "list_likes_user_id_list_id_pk" PRIMARY KEY("user_id","list_id")
);
--> statement-breakpoint
ALTER TABLE "list_likes" ADD CONSTRAINT "list_likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_likes" ADD CONSTRAINT "list_likes_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "list_items_game_idx" ON "list_items" USING btree ("game_id");