import { spawn } from 'node:child_process'
import { resolveLocalEnvironment } from './env-resolve.mjs'

const resolved = resolveLocalEnvironment()
const env = {
  ...process.env,
  DATABASE_URL: resolved.databaseUrl,
  THRIFTIQ_DATABASE_URL_SOURCE: resolved.databaseUrlSource,
}

if (resolved.supabasePublicKey) {
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = resolved.supabasePublicKey
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY = resolved.supabasePublicKey
  env.THRIFTIQ_SUPABASE_PUBLIC_KEY_SOURCE = resolved.supabasePublicKeySource
}

if (resolved.supabaseSecretKey) {
  env.SUPABASE_SECRET_KEY = resolved.supabaseSecretKey
  env.THRIFTIQ_SUPABASE_SECRET_KEY_SOURCE = resolved.supabaseSecretKeySource
}

console.log(`Using database URL from ${resolved.databaseUrlSource}.`)

const isWindows = process.platform === 'win32'
const command = isWindows ? 'cmd.exe' : 'npm'
const args = isWindows ? ['/d', '/s', '/c', 'npm run build'] : ['run', 'build']
const child = spawn(command, args, {
  env,
  stdio: 'inherit',
})

child.on('exit', code => {
  process.exit(code ?? 1)
})
