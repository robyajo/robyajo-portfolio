ALTER TABLE "sync_projects" DROP CONSTRAINT "sync_projects_key_unique";--> statement-breakpoint
CREATE INDEX "sync_projects_key_name_idx" ON "sync_projects" USING btree ("key","name");