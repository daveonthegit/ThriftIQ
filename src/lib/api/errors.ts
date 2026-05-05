import { NextResponse } from 'next/server'

export function databaseUnavailableResponse() {
  return NextResponse.json({
    error: 'Database is not configured for this deployment.',
    code: 'DATABASE_NOT_CONFIGURED',
  }, { status: 503 })
}

export function internalErrorResponse(error: unknown, context: string) {
  console.error(context, error)

  return NextResponse.json({
    error: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  }, { status: 500 })
}
