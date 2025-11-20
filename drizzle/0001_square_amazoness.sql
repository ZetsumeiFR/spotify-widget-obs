CREATE TABLE "widget_token" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widget_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "widget_token" ADD CONSTRAINT "widget_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;