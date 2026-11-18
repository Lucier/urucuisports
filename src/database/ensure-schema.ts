import postgres from 'postgres'

const NETWORK_ERRORS = new Set(['ENETUNREACH', 'ECONNREFUSED', 'ENOTFOUND', 'ENODATA', 'ETIMEDOUT'])

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name varchar(255)`
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS instagram_profile varchar(255)`
  await sql`
    DO $$ BEGIN
      CREATE TYPE post_status AS ENUM ('rascunho', 'revisada', 'pronto');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS status post_status NOT NULL DEFAULT 'rascunho'`
  await sql`ALTER TABLE photo_albums ADD COLUMN IF NOT EXISTS sport_type varchar(50)`
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key varchar(255) PRIMARY KEY,
      count integer NOT NULL DEFAULT 1,
      reset_at timestamptz NOT NULL
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS artilharia (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      nome_jogador varchar(255) NOT NULL,
      league_id uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      foto_url text,
      gols integer NOT NULL DEFAULT 0
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name varchar(255) NOT NULL,
      starts_at timestamptz NOT NULL,
      whatsapp varchar(20),
      site_url text,
      instagram varchar(255),
      card_image bytea NOT NULL,
      card_mime_type varchar(20) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `
  await sql`CREATE INDEX IF NOT EXISTS idx_events_starts_at ON events (starts_at)`
  await sql`ALTER TABLE events ENABLE ROW LEVEL SECURITY`
  // Categorias de esportes. Idempotente: pula se o slug ou o nome já existir.
  const sportCategories = [
    { name: 'Futebol', slug: 'futebol' },
    { name: 'Atletismo', slug: 'atletismo' },
    { name: 'Vôlei', slug: 'volei' },
    { name: 'Jiu-Jítsu', slug: 'jiu-jitsu' },
    { name: 'Ciclismo', slug: 'ciclismo' },
    { name: 'Beach Tênis', slug: 'beach-tenis' },
    { name: 'Capoeira', slug: 'capoeira' },
    { name: 'Futsal', slug: 'futsal' },
    { name: 'Academia', slug: 'academia' },
    { name: 'Futvolei', slug: 'futvolei' },
  ]
  for (const { name, slug } of sportCategories) {
    await sql`
      INSERT INTO categories (name, slug)
      SELECT ${name}::varchar, ${slug}::varchar
      WHERE NOT EXISTS (
        SELECT 1 FROM categories WHERE slug = ${slug}::varchar OR lower(name) = lower(${name}::varchar)
      )
    `
  }

  console.log('Schema ensured.')
  await sql.end()
}

main().catch((err) => {
  if (NETWORK_ERRORS.has(err.code)) {
    console.warn(`Schema migration skipped (${err.code}): DB unreachable from build environment.`)
    console.warn('Use the Supabase connection pooler URL (port 6543) to run migrations during build.')
    process.exit(0)
  }
  console.error('Schema ensure failed:', err)
  process.exit(1)
})
