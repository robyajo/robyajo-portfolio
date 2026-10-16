ALTER TABLE "projects" ADD COLUMN "slug" varchar(256) NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sync_key" varchar(64);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_slug_unique" UNIQUE("slug");