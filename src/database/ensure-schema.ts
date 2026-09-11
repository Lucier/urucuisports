import postgres from 'postgres'

const sql = postgres(process.env.DATABASE_URL!)

async function main() {
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_name varchar(255)`
  console.log('Schema ensured.')
  await sql.end()
}

main().catch((err) => {
  console.error('Schema ensure failed:', err)
  process.exit(1)
})
