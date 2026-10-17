CREATE TABLE "blog_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"name_id" varchar(120) NOT NULL,
	"name_en" varchar(120) NOT NULL,
	"description_id" text,
	"description_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(64) NOT NULL,
	"slug" varchar(64) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_tags_name_unique" UNIQUE("name"),
	CONSTRAINT "blog_tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_categories_sort_idx" ON "blog_categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "blog_tags_sort_idx" ON "blog_tags" USING btree ("sort_order");