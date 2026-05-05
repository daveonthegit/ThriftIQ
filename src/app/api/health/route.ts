import { NextResponse } from 'next/server'
import { databaseUrlSource, isDatabaseConfigured } from '@/lib/db/client'
import { getAppEnvironment, getProductionEnvironmentReadiness } from '@/lib/env'

export function GET() {
  const environment = getAppEnvironment()
  const readiness = getProductionEnvironmentReadiness()

  return NextResponse.json({
    ok: true,
    service: 'thriftiq',
    environment: {
      appUrl: environment.appUrl,
      ebay: environment.ebayEnvironment,
      node: process.env.NODE_ENV ?? 'development',
      databaseConfigured: isDatabaseConfigured,
      databaseUrlSource,
    },
    productionReady: readiness.ready,
    missingProductionEnv: readiness.missing,
  })
}
