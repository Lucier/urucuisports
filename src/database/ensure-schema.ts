import { setDefaultResultOrder } from 'dns'
import postgres from 'postgres'

setDefaultResultOrder('ipv4first')

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name varchar(255)`
  await sql`ALTER TABLE photo_albums ADD COLUMN IF NOT EXISTS sport_type varchar(50)`
  console.log('Schema ensured.')
  await sql.end()
}

main().catch((err) => {
  console.error('Schema ensure failed:', err)
  process.exit(1)
})
