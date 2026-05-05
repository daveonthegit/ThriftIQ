import { NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { db } from '@/lib/db/client'
import { inventoryItems } from '@/lib/db/schema'

const updateInventorySchema = z.object({
  status: z.enum(['sourced', 'listed', 'sold']),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAppUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = updateInventorySchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid inventory update' }, { status: 400 })
  }

  const { id } = await params
  const [row] = await db
    .update(inventoryItems)
    .set({ status: parsed.data.status, updatedAt: new Date() })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, user.id)))
    .returning()

  if (!row) {
    return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
