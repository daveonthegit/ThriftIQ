import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readDatabaseUrl() {
  if (process.argv[2]) {
    return process.argv[2]
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) {
    return ''
  }

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find(value => value.startsWith('DATABASE_URL='))

  return line
    ? line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '')
    : ''
}

const args = process.argv.slice(2)
const mask = args.includes('--mask')
const explicitUrl = args.find(value => value !== '--mask')
const databaseUrl = explicitUrl || readDatabaseUrl()

if (!databaseUrl) {
  console.error('DATABASE_URL is empty.')
  process.exit(1)
}

if (databaseUrl.includes('[password]') || databaseUrl.includes('<password>')) {
  console.error('DATABASE_URL still contains a password placeholder.')
  console.error('Replace it with your actual password. URL-encode special characters in the password.')
  process.exit(1)
}

let parsed

try {
  parsed = new URL(databaseUrl)
} catch {
  console.error('DATABASE_URL is not a valid Postgres URI.')
  console.error('If your password contains special characters, URL-encode it.')
  console.error('PowerShell helper: [uri]::EscapeDataString("YOUR_PASSWORD")')
  process.exit(1)
}

if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
  console.error(`DATABASE_URL must start with postgres:// or postgresql://, got ${parsed.protocol}`)
  process.exit(1)
}

if (!parsed.hostname) {
  console.error('DATABASE_URL is missing a hostname.')
  process.exit(1)
}

const port = parsed.port || '5432'

if (!/^\d+$/.test(port)) {
  console.error(`DATABASE_URL has an invalid port: ${port}`)
  process.exit(1)
}

if (mask) {
  parsed.password = parsed.password ? '****' : ''
  console.log(parsed.toString())
  process.exit(0)
}

const isLocalSupabase =
  ['127.0.0.1', 'localhost'].includes(parsed.hostname) && Number(port) === 54322

console.log(JSON.stringify({ host: parsed.hostname, port: Number(port), isLocalSupabase }))
