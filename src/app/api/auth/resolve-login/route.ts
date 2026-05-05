import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { databaseUnavailableResponse, internalErrorResponse } from '@/lib/api/errors'
import { db, isDatabaseConfigured } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

const requestSchema = z.object({
  identifier: z.string().trim().min(1),
})

export async function POST(request: Request) {
  try {
    const parsed = requestSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid login identifier' }, { status: 400 })
    }

    const identifier = parsed.data.identifier.toLowerCase()

    if (identifier.includes('@')) {
      return NextResponse.json({ email: identifier })
    }

    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.username, identifier))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'Invalid email, username, or password' }, { status: 404 })
    }

    return NextResponse.json({ email: user.email })
  } catch (error) {
    return internalErrorResponse(error, 'Could not resolve login identifier')
  }
}
