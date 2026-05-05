import { NextResponse } from 'next/server'
import { count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { databaseUnavailableResponse, internalErrorResponse } from '@/lib/api/errors'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { db, isDatabaseConfigured } from '@/lib/db/client'
import { searches, users } from '@/lib/db/schema'
import { searchEntitlementFor } from '@/lib/entitlements'

const updateProfileSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(24)
    .regex(/^[a-z0-9_]+$/),
})

export async function GET(request: Request) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [usage] = await db
      .select({ count: count() })
      .from(searches)
      .where(eq(searches.userId, user.id))
    const entitlement = searchEntitlementFor(user)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        initials: user.username.slice(0, 1).toUpperCase(),
        plan: entitlement.plan,
        searchCount: usage?.count ?? 0,
        searchLimit: entitlement.searchLimit,
        unlimitedSearches: entitlement.unlimitedSearches,
      },
    })
  } catch (error) {
    return internalErrorResponse(error, 'Could not load account profile')
  }
}

export async function PATCH(request: Request) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = updateProfileSchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Use 3-24 lowercase letters, numbers, or underscores.' }, { status: 400 })
    }

    const [owner] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, parsed.data.username))
      .limit(1)

    if (owner && owner.id !== user.id) {
      return NextResponse.json({ error: 'Username is already taken.' }, { status: 409 })
    }

    const [updated] = await db
      .update(users)
      .set({ username: parsed.data.username, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning()
    const entitlement = searchEntitlementFor(updated)

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        initials: updated.username.slice(0, 1).toUpperCase(),
        plan: entitlement.plan,
        searchCount: 0,
        searchLimit: entitlement.searchLimit,
        unlimitedSearches: entitlement.unlimitedSearches,
      },
    })
  } catch (error) {
    return internalErrorResponse(error, 'Could not update account profile')
  }
}
