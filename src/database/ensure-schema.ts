import postgres from 'postgres'

const NETWORK_ERRORS = new Set(['ENETUNREACH', 'ECONNREFUSED', 'ENOTFOUND', 'ENODATA', 'ETIMEDOUT'])

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name varchar(255)`
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS instagram_profile varchar(255)`
  await sql`ALTER TABLE photo_albums ADD COLUMN IF NOT EXISTS sport_type varchar(50)`
  await sql`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key varchar(255) PRIMARY KEY,
      count integer NOT NULL DEFAULT 1,
      reset_at timestamptz NOT NULL
    )
  `
  await sql`DROP TABLE IF EXISTS artilharia`
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
