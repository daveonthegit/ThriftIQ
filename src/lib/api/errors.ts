import { NextResponse } from 'next/server'

const databaseConnectionCodes = new Set([
  'ECONNREFUSED',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
])

function findErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const code = 'code' in error && typeof error.code === 'string'
    ? error.code
    : null

  if (code) {
    return code
  }

  return 'cause' in error ? findErrorCode(error.cause) : null
}

export function isDatabaseConnectionError(error: unknown) {
  const code = findErrorCode(error)

  if (code && databaseConnectionCodes.has(code)) {
    return true
  }

  return error instanceof Error && /getaddrinfo|connect|network|timeout/i.test(error.message)
}

export function databaseUnavailableResponse() {
  return NextResponse.json({
    error: 'Database is unavailable from this deployment.',
    code: 'DATABASE_UNAVAILABLE',
  }, { status: 503 })
}

export function internalErrorResponse(error: unknown, context: string) {
  console.error(context, error)

  if (isDatabaseConnectionError(error)) {
    return databaseUnavailableResponse()
  }

  return NextResponse.json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  }, { status: 500 })
}
