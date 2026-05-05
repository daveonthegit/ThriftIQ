import net from 'node:net'
import { resolveLocalEnvironment } from './env-resolve.mjs'

function envDatabaseUrl() {
  if (process.argv[2] && !process.argv[2].startsWith('--')) {
    return process.argv[2]
  }

  return resolveLocalEnvironment().databaseUrl
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
