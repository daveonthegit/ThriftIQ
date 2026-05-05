import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(import.meta.dirname, '..')
const envPath = resolve(root, '.env.local')

function readEnvFile() {
  if (!existsSync(envPath)) {
    return {}
  }

  const values = {}
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separator = trimmed.indexOf('=')

    if (separator === -1) {
      continue
    }

    const key = trimmed.slice(0, separator)
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, '')

    values[key] = value
  }

  return values
}

export function resolveLocalEnvironment() {
  const fileEnv = readEnvFile()
  const value = name => process.env[name] || fileEnv[name] || ''
  const databaseUrl =
    value('POSTGRES_URL') ||
    value('POSTGRES_PRISMA_URL') ||
    value('DATABASE_URL') ||
    value('SUPABASE_DB_URL') ||
    'postgres://postgres:postgres@127.0.0.1:54322/postgres'
  const databaseUrlSource =
    value('POSTGRES_URL') ? 'POSTGRES_URL'
    : value('POSTGRES_PRISMA_URL') ? 'POSTGRES_PRISMA_URL'
    : value('DATABASE_URL') ? 'DATABASE_URL'
    : value('SUPABASE_DB_URL') ? 'SUPABASE_DB_URL'
    : 'default-local-supabase'
  const supabasePublicKey =
    value('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ||
    value('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    value('SUPABASE_PUBLISHABLE_KEY') ||
    value('SUPABASE_ANON_KEY')
  const supabasePublicKeySource =
    value('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ? 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'
    : value('NEXT_PUBLIC_SUPABASE_ANON_KEY') ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    : value('SUPABASE_PUBLISHABLE_KEY') ? 'SUPABASE_PUBLISHABLE_KEY'
    : value('SUPABASE_ANON_KEY') ? 'SUPABASE_ANON_KEY'
    : null
  const supabaseSecretKey =
    value('SUPABASE_SECRET_KEY') ||
    value('SUPABASE_SERVICE_ROLE_KEY')
  const supabaseSecretKeySource =
    value('SUPABASE_SECRET_KEY') ? 'SUPABASE_SECRET_KEY'
    : value('SUPABASE_SERVICE_ROLE_KEY') ? 'SUPABASE_SERVICE_ROLE_KEY'
    : null

  return {
    databaseUrl,
    databaseUrlSource,
    supabasePublicKey,
    supabasePublicKeySource,
    supabaseSecretKey,
    supabaseSecretKeySource,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const env = resolveLocalEnvironment()
  const shell = process.argv.includes('--shell')

  if (shell) {
    const quote = value => JSON.stringify(value ?? '')

    console.log(`DATABASE_URL=${quote(env.databaseUrl)}`)
    console.log(`THRIFTIQ_DATABASE_URL_SOURCE=${quote(env.databaseUrlSource)}`)

    if (env.supabasePublicKey) {
      console.log(`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${quote(env.supabasePublicKey)}`)
      console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${quote(env.supabasePublicKey)}`)
      console.log(`THRIFTIQ_SUPABASE_PUBLIC_KEY_SOURCE=${quote(env.supabasePublicKeySource)}`)
    }

    if (env.supabaseSecretKey) {
      console.log(`SUPABASE_SECRET_KEY=${quote(env.supabaseSecretKey)}`)
      console.log(`THRIFTIQ_SUPABASE_SECRET_KEY_SOURCE=${quote(env.supabaseSecretKeySource)}`)
    }
  } else {
    console.log(JSON.stringify(env))
  }
}
