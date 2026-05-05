import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

function fallbackUsername(email: string) {
  return email
    .split('@')[0]!
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .slice(0, 24)
}

function bearerToken(request: Request) {
  return request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
}

export async function getCurrentAppUser(request: Request) {
  const token = bearerToken(request)

  if (!token) {
    return null
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user?.email) {
    return null
  }

  const authId = data.user.id
  const email = data.user.email.toLowerCase()

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.supabaseAuthId, authId))
    .limit(1)

  if (existing) {
    return existing
  }

  const metadataUsername = data.user.user_metadata.username
  const username = typeof metadataUsername === 'string'
    ? metadataUsername.toLowerCase()
    : fallbackUsername(email)

  const [created] = await db
    .insert(users)
    .values({ supabaseAuthId: authId, email, username })
    .returning()

  return created
}
