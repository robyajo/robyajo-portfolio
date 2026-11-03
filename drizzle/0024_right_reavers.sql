CREATE TABLE IF NOT EXISTS "ai_providers" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"base_url" varchar(512) NOT NULL,
	"api_key" text,
	"description" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_providers_enabled_idx" ON "ai_providers" USING btree ("enabled");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_id" varchar(64) NOT NULL REFERENCES "ai_providers"("id") ON DELETE cascade ON UPDATE cascade,
	"model_id" varchar(128) NOT NULL,
	"name" varchar(128) NOT NULL,
	"family" varchar(64),
	"description" text,
	"is_thinking_supported" boolean DEFAULT false NOT NULL,
	"reasoning_effort" varchar(32) DEFAULT 'medium' NOT NULL,
	"pricing" jsonb,
	"features" jsonb,
	"enabled" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_models_provider_model_unique" UNIQUE("provider_id","model_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_provider_idx" ON "ai_models" USING btree ("provider_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_enabled_idx" ON "ai_models" USING btree ("enabled");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_settings" (
	"task" varchar(64) PRIMARY KEY NOT NULL,
	"provider_id" varchar(64) NOT NULL REFERENCES "ai_providers"("id") ON DELETE cascade ON UPDATE cascade,
	"model_id" varchar(128) NOT NULL,
	"enable_thinking" boolean DEFAULT false NOT NULL,
	"reasoning_effort" varchar(32) DEFAULT 'medium' NOT NULL,
	"temperature" varchar(16) DEFAULT '0.7' NOT NULL,
	"max_tokens" integer DEFAULT 2048 NOT NULL,
	"system_prompt" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
