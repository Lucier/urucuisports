DO $$ BEGIN
  CREATE TYPE "post_status" AS ENUM('rascunho', 'revisada', 'pronto');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "status" "post_status" NOT NULL DEFAULT 'rascunho';
