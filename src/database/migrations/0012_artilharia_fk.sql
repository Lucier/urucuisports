DROP INDEX IF EXISTS "idx_artilharia_liga";--> statement-breakpoint
ALTER TABLE "artilharia" DROP COLUMN IF EXISTS "liga";--> statement-breakpoint
ALTER TABLE "artilharia" DROP COLUMN IF EXISTS "time";--> statement-breakpoint
ALTER TABLE "artilharia" ADD COLUMN "league_id" uuid NOT NULL REFERENCES "leagues"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "artilharia" ADD COLUMN "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "idx_artilharia_league" ON "artilharia" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "idx_artilharia_team" ON "artilharia" USING btree ("team_id");
