import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { resolveRangeDays } from '@/lib/snapshotCalc'

// GET: ポートフォリオ履歴を取得
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || '1M'
  const days = resolveRangeDays(range, 30)

  const where: { userId: string; snapshotDate?: { gte: Date } } = {
    userId: user.id,
  }

  if (days > 0) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)
    where.snapshotDate = { gte: since }
  }

  const detail = url.searchParams.get('detail') !== 'false'

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where,
    include: { stockSnapshots: detail },
    orderBy: { snapshotDate: 'asc' },
  })

  // 銘柄名マップ（StockPriceSnapshotはStockへのリレーションを持たないため別クエリで解決）
  const stockNameMap = new Map<string, string>()
  if (detail) {
    const symbols = [...new Set(
      snapshots.flatMap(s => ('stockSnapshots' in s ? (s.stockSnapshots as { symbol: string }[]).map(ss => ss.symbol) : []))
    )]
    if (symbols.length > 0) {
      const stocks = await prisma.stock.findMany({
        where: { userId: user.id, symbol: { in: symbols } },
        select: { symbol: true, name: true },
      })
      stocks.forEach(st => { if (st.name) stockNameMap.set(st.symbol, st.name) })
    }
  }

  const data = snapshots.map(s => {
    const base: Record<string, unknown> = {
      id: s.id,
      snapshotDate: s.snapshotDate.toISOString().split('T')[0],
      totalInvestment: Number(s.totalInvestment),
      totalValue: Number(s.totalValue),
      profitLoss: Number(s.profitLoss),
      cashAmount: Number(s.cashAmount),
      netAssets: Number(s.netAssets),
      stockSnapshots: [],
    }
    if (detail && 'stockSnapshots' in s) {
      const ss = s.stockSnapshots as { stockId: string; symbol: string; currentPrice: unknown; shares: number; value: unknown; cost: unknown }[]
      base.stockSnapshots = ss.map(snap => ({
        stockId: snap.stockId,
        symbol: snap.symbol,
        name: stockNameMap.get(snap.symbol) ?? null,
        currentPrice: snap.currentPrice != null ? Number(snap.currentPrice) : null,
        shares: snap.shares,
        value: Number(snap.value),
        cost: Number(snap.cost),
      }))
    }
    return base
  })

  return NextResponse.json({ success: true, data })
}, 'ポートフォリオ履歴の取得')
