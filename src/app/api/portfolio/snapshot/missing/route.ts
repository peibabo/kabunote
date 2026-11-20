import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'
import { addDaysToDateStr, findMissingBusinessDays, MISSING_LOOKBACK_DAYS } from '@/lib/snapshotBackfill'

// GET: 直近（30日）で記録していない東証営業日を新しい順で返す
// （履歴 API は選択中の期間で絞られるため、未記録日の判定は別に行う）
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
  const missingDates = findMissingBusinessDays(
    recent.map(s => toStr(s.snapshotDate)),
    first ? toStr(first.snapshotDate) : null,
    today,
  )

  return NextResponse.json({ success: true, data: { missingDates } })
}, '未記録日の取得')
