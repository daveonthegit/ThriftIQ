import { defineConfig } from 'drizzle-kit'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local')

  if (!existsSync(envPath)) {
    return
  }

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
      .replace(/^["']|["']$/g, '')

    process.env[key] ??= value
  }
}

loadLocalEnv()

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
