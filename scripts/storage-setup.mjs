import { existsSync, readFileSync } from 'node:fs'
import { request } from 'node:https'
import { resolve } from 'node:path'

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

  if (!line) {
    return ''
  }

  return line
    .slice(name.length + 1)
    .trim()
    .replace(/^["']|["']$/g, '')
}

function requestJson(url, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolveRequest, rejectRequest) => {
    const payload = body ? JSON.stringify(body) : undefined
    const parsed = new URL(url)

    const req = request(
      {
        method,
        hostname: parsed.hostname,
        path: `${parsed.pathname}${parsed.search}`,
        port: parsed.port || 443,
        headers: {
          ...headers,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      response => {
        let data = ''

        response.setEncoding('utf8')
        response.on('data', chunk => {
          data += chunk
        })
        response.on('end', () => {
          resolveRequest({
            ok: response.statusCode >= 200 && response.statusCode < 300,
            status: response.statusCode,
            body: data,
          })
        })
      },
    )

    req.on('error', rejectRequest)

    if (payload) {
      req.write(payload)
    }

    req.end()
  })
}

const supabaseUrl = envValue('NEXT_PUBLIC_SUPABASE_URL')
const secretKey = envValue('SUPABASE_SECRET_KEY')
const bucketName = process.argv[2] || envValue('SUPABASE_STORAGE_BUCKET') || 'receipts'

if (!supabaseUrl || !secretKey) {
  console.log('Supabase storage setup skipped.')
  console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.')
  process.exitCode = 0
} else {
  const headers = {
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    'Content-Type': 'application/json',
  }

  const bucketUrl = `${supabaseUrl}/storage/v1/bucket/${bucketName}`
  const existing = await requestJson(bucketUrl, { headers })

  if (existing.ok) {
    console.log(`Storage bucket '${bucketName}' already exists.`)
  } else if (existing.status !== 404) {
    throw new Error(`Could not check storage bucket '${bucketName}' (${existing.status}): ${existing.body}`)
  } else {
    const created = await requestJson(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers,
      body: {
        id: bucketName,
        name: bucketName,
        public: false,
        file_size_limit: 10 * 1024 * 1024,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      },
    })

    if (!created.ok) {
      throw new Error(`Could not create storage bucket '${bucketName}' (${created.status}): ${created.body}`)
    }

    console.log(`Created private storage bucket '${bucketName}'.`)
  }
}
