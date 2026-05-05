import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'

const requestSchema = z.object({
  identifier: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid login identifier' }, { status: 400 })
  }

  const identifier = parsed.data.identifier.toLowerCase()

  if (identifier.includes('@')) {
    return NextResponse.json({ email: identifier })
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
}
