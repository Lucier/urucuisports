CREATE TABLE "artilharia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome_jogador" varchar(255) NOT NULL,
	"liga" varchar(255) NOT NULL,
	"time" varchar(255) NOT NULL,
	"gols" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "photo_albums" ADD COLUMN "sport_type" varchar(50);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "author_name" varchar(255);--> statement-breakpoint
CREATE INDEX "idx_artilharia_liga" ON "artilharia" USING btree ("liga");