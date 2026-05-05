import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

const requestSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/)
    .optional(),
})

function fallbackUsername(email: string) {
  return email
    .split('@')[0]!
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 24)
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')

  if (!token) {
    return NextResponse.json({ error: 'Missing auth token' }, { status: 401 })
  }

  const body = request.headers.get('content-length') === '0'
    ? {}
    : await request.json().catch(() => ({}))
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid username' }, { status: 400 })
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user?.email) {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 })
  }

  const email = data.user.email.toLowerCase()
  const username = (parsed.data.username ?? fallbackUsername(email)).toLowerCase()

  const [usernameOwner] = await db
    .select({ id: users.id, supabaseAuthId: users.supabaseAuthId })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (usernameOwner && usernameOwner.supabaseAuthId !== data.user.id) {
    return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.supabaseAuthId, data.user.id))
    .limit(1)

  if (existing) {
    await db
      .update(users)
      .set({ email, username, updatedAt: new Date() })
      .where(eq(users.supabaseAuthId, data.user.id))
  } else {
    await db.insert(users).values({
      supabaseAuthId: data.user.id,
      email,
      username,
    })
  }

  return NextResponse.json({ ok: true, username })
}
