import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { RANGE_DAYS } from '@/lib/snapshotCalc'

// GET: ポートフォリオ履歴を取得
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || '1M'
  const days = RANGE_DAYS[range] ?? 30

  const where: { userId: string; snapshotDate?: { gte: Date } } = {
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
    include: { stockSnapshots: true },
    orderBy: { snapshotDate: 'asc' },
  })

  const data = snapshots.map(s => ({
    id: s.id,
    snapshotDate: s.snapshotDate.toISOString().split('T')[0],
    totalInvestment: Number(s.totalInvestment),
    totalValue: Number(s.totalValue),
    profitLoss: Number(s.profitLoss),
    cashAmount: Number(s.cashAmount),
    netAssets: Number(s.netAssets),
    stockSnapshots: s.stockSnapshots.map(ss => ({
      symbol: ss.symbol,
      currentPrice: ss.currentPrice != null ? Number(ss.currentPrice) : null,
      shares: ss.shares,
      value: Number(ss.value),
      cost: Number(ss.cost),
    })),
  }))

  return NextResponse.json({ success: true, data })
}, 'ポートフォリオ履歴の取得')
