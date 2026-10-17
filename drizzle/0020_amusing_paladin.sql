CREATE TABLE "visitors" (
	"hash" varchar(64) PRIMARY KEY NOT NULL,
	"views" integer DEFAULT 1 NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "visitors_last_seen_idx" ON "visitors" USING btree ("last_seen_at");