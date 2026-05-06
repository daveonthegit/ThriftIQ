import { NextResponse } from 'next/server'
import { desc, sql } from 'drizzle-orm'
import { databaseUnavailableResponse, internalErrorResponse } from '@/lib/api/errors'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { db, isDatabaseConfigured } from '@/lib/db/client'
import { searches } from '@/lib/db/schema'

const normalizedQuery = sql`lower(trim(regexp_replace(${searches.query}, '\\s+', ' ', 'g')))`

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await db
      .select({
        query: sql<string>`min(${searches.query})`,
        count: sql<number>`count(*)::int`,
      })
      .from(searches)
      .groupBy(normalizedQuery)
      .orderBy(desc(sql`count(*)`), desc(sql`max(${searches.createdAt})`))
      .limit(8)

    return NextResponse.json({
      trending: rows
        .filter(row => row.query.trim())
        .map(row => ({
          query: row.query,
          count: Number(row.count),
        })),
    })
  } catch (error) {
    return internalErrorResponse(error, 'Could not load trending searches')
  }
}
