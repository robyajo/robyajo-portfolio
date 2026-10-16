CREATE TABLE "activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_key" varchar(64) NOT NULL,
	"project_name" varchar(256) NOT NULL,
	"kind" varchar(32) DEFAULT 'update' NOT NULL,
	"title_id" text NOT NULL,
	"title_en" text NOT NULL,
	"body_id" text,
	"body_en" text,
	"url" varchar(2048),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "activities_project_idx" ON "activities" USING btree ("project_key");--> statement-breakpoint
CREATE INDEX "activities_occurred_idx" ON "activities" USING btree ("occurred_at");