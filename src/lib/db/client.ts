import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL

export const isDatabaseConfigured = Boolean(databaseUrl)
export const databaseUrlSource =
  process.env.POSTGRES_URL ? 'POSTGRES_URL'
  : process.env.POSTGRES_PRISMA_URL ? 'POSTGRES_PRISMA_URL'
  : process.env.DATABASE_URL ? 'DATABASE_URL'
  : process.env.SUPABASE_DB_URL ? 'SUPABASE_DB_URL'
  : null

const client = databaseUrl
  ? postgres(databaseUrl, { prepare: false })
  : postgres('postgres://postgres:postgres@127.0.0.1:54322/postgres', {
      prepare: false,
      idle_timeout: 1,
      connect_timeout: 1,
    })

export const db = drizzle(client, { schema })
