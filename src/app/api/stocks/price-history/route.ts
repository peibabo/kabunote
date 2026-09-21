import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { RANGE_DAYS } from '@/lib/snapshotCalc'
import type { StockPriceHistoryItem } from '@/types/portfolio'

/** URLが長くなりすぎないための上限（ダッシュボードの銘柄上限は20なので実質かからない） */
const MAX_STOCK_IDS = 50

// GET: 複数銘柄の株価履歴をまとめて取得（?range=3M&stockIds=id1,id2）
//
// 銘柄別ルート（`/api/stocks/[stockId]/price-history`）を銘柄数ぶん呼ぶと、
// 期間内の全スナップショットを読むスキャンが毎回繰り返される（N+1 API Call）。
// ここでは1回のスキャンで全対象銘柄ぶんを返す。
//
// 静的セグメントは動的セグメントより優先されるため、このルートは
// `/api/stocks/[stockId]/price-history` と衝突しない。
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || '3M'
  const days = RANGE_DAYS[range] ?? 90

  const requestedIds = (url.searchParams.get('stockIds') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  if (requestedIds.length === 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'stockIdsが必要です' },
      { status: 400 }
    )
  }
  if (requestedIds.length > MAX_STOCK_IDS) {
    return NextResponse.json(
      { error: 'Bad Request', message: `stockIdsは${MAX_STOCK_IDS}件以内である必要があります` },
      { status: 400 }
    )
  }

  // 他ユーザーの銘柄IDを弾く（スナップショット自体も userId で絞るが、
  // 応答に未知のIDのキーを作らないよう入口でも絞る）
  const ownedStocks = await prisma.stock.findMany({
    where: { userId: user.id, id: { in: requestedIds } },
    select: { id: true },
  })
  const stockIds = ownedStocks.map(s => s.id)

  if (stockIds.length === 0) {
    return NextResponse.json({ success: true, history: {} })
  }

  const where: { userId: string; snapshotDate?: { gte: Date } } = { userId: user.id }
  if (days > 0) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)
    where.snapshotDate = { gte: since }
  }

  const snapshots = await prisma.portfolioSnapshot.findMany({
    where,
    include: {
      stockSnapshots: { where: { stockId: { in: stockIds } } },
    },
    orderBy: { snapshotDate: 'asc' },
  })

  // 銘柄ID → 日付昇順の履歴
  const history: Record<string, StockPriceHistoryItem[]> = {}
  for (const id of stockIds) history[id] = []

  for (const snapshot of snapshots) {
    const date = snapshot.snapshotDate.toISOString().split('T')[0]
    for (const ss of snapshot.stockSnapshots) {
      history[ss.stockId]?.push({
        snapshotId: snapshot.id,
        date,
        price: ss.currentPrice != null ? Number(ss.currentPrice) : null,
        shares: ss.shares,
        value: Number(ss.value),
        cost: Number(ss.cost),
      })
    }
  }

  return NextResponse.json({ success: true, history })
}, '銘柄の株価履歴の一括取得')
