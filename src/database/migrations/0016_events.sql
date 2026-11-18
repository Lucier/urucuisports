CREATE TABLE IF NOT EXISTS "events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "whatsapp" varchar(20),
  "site_url" text,
  "instagram" varchar(255),
  "card_image" bytea NOT NULL,
  "card_mime_type" varchar(20) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_events_starts_at" ON "events" USING btree ("starts_at");
--> statement-breakpoint
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
