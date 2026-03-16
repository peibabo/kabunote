import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'
import { RANGE_DAYS } from '@/lib/snapshotCalc'

// GET: 個別銘柄の株価履歴を取得
export const GET = withStock(async ({ user, stockId, request }) => {
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || '3M'
  const days = RANGE_DAYS[range] ?? 90

  const where: {
    userId: string
    snapshotDate?: { gte: Date }
  } = {
    userId: user.id,
  }

  if (days > 0) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)
    where.snapshotDate = { gte: since }
  }

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where,
    include: {
      stockSnapshots: {
        where: { stockId },
      },
    },
    orderBy: { snapshotDate: 'asc' },
  })

  const history = snapshots
    .map(s => {
      const ss = s.stockSnapshots[0]
      if (!ss) return null
      return {
        date: s.snapshotDate.toISOString().split('T')[0],
        price: ss.currentPrice != null ? Number(ss.currentPrice) : null,
        shares: ss.shares,
        value: Number(ss.value),
        cost: Number(ss.cost),
      }
    })
    .filter(Boolean)

  return NextResponse.json({ success: true, history })
}, '個別銘柄の株価履歴取得')
