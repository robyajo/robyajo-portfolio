CREATE TABLE "visitor_days" (
	"hash" varchar(64) NOT NULL,
	"day" date NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "visitor_days_hash_day_pk" PRIMARY KEY("hash","day")
);
--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "browser" varchar(64);--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "os" varchar(64);--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "form_factor" varchar(32);--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "user_agent" text;--> statement-breakpoint
CREATE INDEX "visitor_days_day_idx" ON "visitor_days" USING btree ("day");