import postgres from 'postgres'

const NETWORK_ERRORS = new Set(['ENETUNREACH', 'ECONNREFUSED', 'ENOTFOUND', 'ENODATA', 'ETIMEDOUT'])

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name varchar(255)`
  await sql`ALTER TABLE photo_albums ADD COLUMN IF NOT EXISTS sport_type varchar(50)`
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
