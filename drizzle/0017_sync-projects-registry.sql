CREATE TABLE "sync_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" varchar(256) NOT NULL,
	"url" varchar(2048),
	"description" text,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_projects_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "external_id" varchar(256);--> statement-breakpoint
CREATE INDEX "sync_projects_name_idx" ON "sync_projects" USING btree ("name");--> statement-breakpoint
CREATE INDEX "activities_project_external_idx" ON "activities" USING btree ("project_key","external_id");