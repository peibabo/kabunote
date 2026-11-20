import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'
import {
  addDaysToDateStr,
  findMissingBusinessDays,
  hasHoldingsAt,
  toBackfillInputs,
  MISSING_LOOKBACK_DAYS,
} from '@/lib/snapshotBackfill'

// GET: 直近（30日）で記録していない東証営業日を新しい順で返す
// （履歴 API は選択中の期間で絞られるため、未記録日の判定は別に行う）
// 何も保有していなかった日は後から追加できない（backfill が400になる）ため含めない
export const GET = withAuth(async ({ user }) => {
  const today = getTodayJST()
  const since = dateStrToUTCMidnight(addDaysToDateStr(today, -MISSING_LOOKBACK_DAYS))

  const [first, recent] = await Promise.all([
    prisma.portfolioSnapshot.findFirst({
      where: { userId: user.id },
      orderBy: { snapshotDate: 'asc' },
      select: { snapshotDate: true },
    }),
    prisma.portfolioSnapshot.findMany({
      where: { userId: user.id, snapshotDate: { gte: since } },
      select: { snapshotDate: true },
    }),
  ])

  const toStr = (d: Date) => d.toISOString().slice(0, 10)
  const candidates = findMissingBusinessDays(
    recent.map(s => toStr(s.snapshotDate)),
    first ? toStr(first.snapshotDate) : null,
    today,
  )
  if (candidates.length === 0) {
    return NextResponse.json({ success: true, data: { missingDates: [] } })
  }

  // 保有の判定には、候補の最も古い日より後の売却だけあれば足りる
  const oldest = candidates[candidates.length - 1]
  const stocks = await prisma.stock.findMany({
    where: { userId: user.id },
    select: {
      positions: { select: { id: true, shares: true, purchasePrice: true, purchaseDate: true, taxRate: true, createdAt: true } },
      realizedTrades: {
        where: { sellDate: { gt: oldest } },
        select: { id: true, sellDate: true, costBasis: true, taxRate: true, consumedLots: true },
      },
    },
  })
  const inputs = stocks.map(toBackfillInputs)
  const missingDates = candidates.filter(d => hasHoldingsAt(d, inputs))

  return NextResponse.json({ success: true, data: { missingDates } })
}, '未記録日の取得')
