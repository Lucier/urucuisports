import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined
}

const isProd = process.env.NODE_ENV === 'production'

// Reuse the same client across hot reloads in development.
// In production each process creates exactly one client.
const client = globalThis._pgClient ?? postgres(connectionString, {
  max: isProd ? 20 : 3,
  idle_timeout: isProd ? 60 : 20,
  connect_timeout: 10,
  prepare: false,
})

if (process.env.NODE_ENV !== 'production') {
  globalThis._pgClient = client
}

export { client }
export const db = drizzle(client, { schema })
