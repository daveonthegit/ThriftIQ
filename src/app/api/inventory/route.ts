import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { databaseUnavailableResponse, internalErrorResponse } from '@/lib/api/errors'
import { getCurrentAppUser } from '@/lib/auth/current-user'
import { db, isDatabaseConfigured } from '@/lib/db/client'
import { inventoryItems } from '@/lib/db/schema'

const createInventorySchema = z.object({
  title: z.string().min(1),
  cost: z.number().nonnegative(),
  est: z.number().nonnegative(),
  swatch: z.string().min(1).default('#3A3A3A'),
  swatch2: z.string().min(1).default('#1A1A1A'),
})

function mapInventoryItem(row: typeof inventoryItems.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    cost: Number(row.itemCost),
    est: Number(row.targetListPrice ?? 0),
    status: row.status === 'archived' ? 'sourced' : row.status,
    swatch: row.swatch,
    swatch2: row.swatch2,
    date: row.createdAt ? new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.round((row.createdAt.getTime() - Date.now()) / 86_400_000),
      'day',
    ) : 'just now',
  }
}

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
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.userId, user.id))
      .orderBy(desc(inventoryItems.createdAt))

    return NextResponse.json({ items: rows.map(mapInventoryItem) })
  } catch (error) {
    return internalErrorResponse(error, 'Could not load inventory')
  }
}

export async function POST(request: Request) {
  try {
    if (!isDatabaseConfigured) {
      return databaseUnavailableResponse()
    }

    const user = await getCurrentAppUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const parsed = createInventorySchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid inventory item' }, { status: 400 })
    }

    const profit = parsed.data.est - parsed.data.cost
    const marginBps = parsed.data.cost > 0 ? Math.round((profit / parsed.data.cost) * 10_000) : 0

    const [row] = await db
      .insert(inventoryItems)
      .values({
        userId: user.id,
        title: parsed.data.title,
        itemCost: String(parsed.data.cost),
        targetListPrice: String(parsed.data.est),
        estimatedProfit: String(profit),
        estimatedMarginBps: marginBps,
        status: 'sourced',
        swatch: parsed.data.swatch,
        swatch2: parsed.data.swatch2,
      })
      .returning()

    return NextResponse.json({ item: mapInventoryItem(row) }, { status: 201 })
  } catch (error) {
    return internalErrorResponse(error, 'Could not create inventory item')
  }
}
