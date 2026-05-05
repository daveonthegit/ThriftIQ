import net from 'node:net'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function envDatabaseUrl() {
  if (process.argv[2]) {
    return process.argv[2]
  }

  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const envPath = resolve(process.cwd(), '.env.local')

  if (!existsSync(envPath)) {
    return 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
  }

  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find(value => value.startsWith('DATABASE_URL='))

  return line
    ? line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '')
    : 'postgres://postgres:postgres@127.0.0.1:54322/postgres'
}

const databaseUrl = envDatabaseUrl()
const parsed = new URL(databaseUrl)
const port = Number(parsed.port || 5432)

console.log(`Checking database port ${parsed.hostname}:${port}...`)

const socket = net.createConnection({
  host: parsed.hostname,
  port,
  family: 0,
})

const timeout = setTimeout(() => {
  socket.destroy()
  console.error(`Timed out connecting to ${parsed.hostname}:${port}.`)
  process.exit(1)
}, 5000)

socket.on('connect', () => {
  clearTimeout(timeout)
  socket.end()
  console.log('Database port is reachable.')
})

socket.on('error', error => {
  clearTimeout(timeout)
  console.error(error.message)
  process.exit(1)
})
