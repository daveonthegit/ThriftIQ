import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, '.env.local')

function envValue(name) {
  if (process.env[name]) {
    return process.env[name]
  }

  if (!existsSync(envPath)) {
    return ''
  }

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find(value => value.startsWith(`${name}=`))

  return line
    ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '')
    : ''
}

function usage() {
  console.log('Usage:')
  console.log('  npm run user:grant-unlimited -- <email-or-username>')
  console.log('  npm run user:revoke-unlimited -- <email-or-username>')
}

const mode = process.argv[2]
const identifier = process.argv[3]?.trim().toLowerCase()

if (!['grant', 'revoke'].includes(mode) || !identifier) {
  usage()
  process.exit(1)
}

const databaseUrl = envValue('DATABASE_URL')

if (!databaseUrl) {
  console.error('DATABASE_URL is empty. Set it in .env.local first.')
  process.exit(1)
}

const sql = postgres(databaseUrl, { max: 1 })

try {
  const unlimited = mode === 'grant'
  const plan = unlimited ? 'Developer' : 'Free'
  const searchLimit = unlimited ? 2147483647 : 10

  const rows = await sql`
    update users
    set
      plan = ${plan},
      search_limit = ${searchLimit},
      unlimited_searches = ${unlimited ? 1 : 0},
      updated_at = now()
    where lower(email) = ${identifier} or lower(username) = ${identifier}
    returning id, email, username, plan, search_limit, unlimited_searches
  `

  if (rows.length === 0) {
    console.error(`No user found for '${identifier}'. Sign in once first so Supabase creates the profile row.`)
    process.exit(1)
  }

  const user = rows[0]
  console.log(`${unlimited ? 'Granted' : 'Revoked'} unlimited searches for ${user.username} <${user.email}>.`)
  console.log(`Plan: ${user.plan}`)
  console.log(`Search limit: ${Number(user.unlimited_searches) === 1 ? 'unlimited' : user.search_limit}`)
} finally {
  await sql.end()
}
