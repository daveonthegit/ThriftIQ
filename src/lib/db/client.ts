import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('DATABASE_URL is required in production')
}

const client = databaseUrl
  ? postgres(databaseUrl, { prepare: false })
  : postgres('postgres://postgres:postgres@127.0.0.1:54322/postgres', {
      prepare: false,
      idle_timeout: 1,
      connect_timeout: 1,
    })

export const db = drizzle(client, { schema })
