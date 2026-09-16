import { resolve4 } from 'dns/promises'
import postgres from 'postgres'

async function main() {
  const dbUrl = new URL(process.env.DATABASE_URL!)
  const [ipv4] = await resolve4(dbUrl.hostname)

  const sql = postgres({
    host: ipv4,
    port: Number(dbUrl.port) || 5432,
    database: dbUrl.pathname.slice(1),
    username: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    ssl: 'require',
  })

  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name varchar(255)`
  await sql`ALTER TABLE photo_albums ADD COLUMN IF NOT EXISTS sport_type varchar(50)`
  console.log('Schema ensured.')
  await sql.end()
}

main().catch((err) => {
  console.error('Schema ensure failed:', err)
  process.exit(1)
})
