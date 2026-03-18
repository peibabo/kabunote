import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { evaluateTitles, TOTAL_TITLE_COUNT } from '@/lib/titles'
import type { TitleCheckData } from '@/types/titles'

export const GET = withAuth(async ({ user }) => {
  const userId = user.id

  // 全集計データを並列取得
  const [
    stockCount,
    memoCount,
    tagCount,
    tagColors,
    positionCount,
    dividendCount,
    benefitCount,
    eventCount,
    nextActionCount,
    snapshotCount,
    feedbackCount,
    gamification,
    stocksWithMemoCount,
  ] = await Promise.all([
    prisma.stock.count({ where: { userId } }),
    prisma.stockMemo.count({ where: { stock: { userId } } }),
    prisma.stockTag.count({ where: { stock: { userId } } }),
    prisma.stockTag.groupBy({ by: ['color'], where: { stock: { userId } } }),
    prisma.stockPosition.count({ where: { stock: { userId } } }),
    prisma.stockDividend.count({ where: { stock: { userId } } }),
    prisma.stockBenefit.count({ where: { stock: { userId } } }),
    prisma.stockEvent.count({ where: { stock: { userId } } }),
    prisma.nextActionPlan.count({ where: { stock: { userId }, OR: [{ strategyMemo: { not: null } }, { targetPrice: { not: null } }, { targetShares: { not: null } }] } }),
    prisma.portfolioSnapshot.count({ where: { userId } }),
    prisma.feedback.count({ where: { userId } }),
    prisma.userGamification.findUnique({ where: { userId } }),
    prisma.stock.count({ where: { userId, memo: { isNot: null } } }),
  ])

  const data: TitleCheckData = {
    stockCount,
    memoCount,
    tagCount,
    distinctTagColorCount: tagColors.length,
    positionCount,
    dividendCount,
    benefitCount,
    eventCount,
    nextActionCount,
    snapshotCount,
    feedbackCount,
    level: gamification?.level ?? 1,
    longestStreak: gamification?.longestStreak ?? 0,
    allStocksHaveMemo: stockCount > 0 && stockCount === stocksWithMemoCount,
  }

  const titles = evaluateTitles(data)
  const unlockedCount = titles.filter(t => t.unlocked).length

  return NextResponse.json({
    success: true,
    data: {
      titles,
      unlockedCount,
      totalCount: TOTAL_TITLE_COUNT,
    },
  })
}, '称号取得')
