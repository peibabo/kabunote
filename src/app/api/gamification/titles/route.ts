import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { evaluateTitles, TOTAL_TITLE_COUNT } from '@/lib/titles'
import { getTodayJST, getJSTDateDaysAgo, formatDateJST } from '@/lib/dateJst'
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
    realizedTradeAgg,
    dividendCount,
    benefitCount,
    eventCount,
    nextActionCount,
    snapshotCount,
    feedbackCount,
    gamification,
    stocksWithMemoCount,
    checklistCompleteStreak,
  ] = await Promise.all([
    prisma.stock.count({ where: { userId } }),
    prisma.stockMemo.count({ where: { stock: { userId } } }),
    prisma.stockTag.count({ where: { stock: { userId } } }),
    prisma.stockTag.groupBy({ by: ['color'], where: { stock: { userId } } }),
    prisma.stockPosition.count({ where: { stock: { userId } } }),
    prisma.realizedTrade.aggregate({ where: { stock: { userId } }, _count: { id: true }, _sum: { realizedPL: true } }),
    prisma.stockDividend.count({ where: { stock: { userId } } }),
    prisma.stockBenefit.count({ where: { stock: { userId } } }),
    prisma.stockEvent.count({ where: { stock: { userId } } }),
    prisma.nextActionPlan.count({ where: { stock: { userId }, OR: [{ strategyMemo: { not: null } }, { targetPrice: { not: null } }, { targetShares: { not: null } }] } }),
    prisma.portfolioSnapshot.count({ where: { userId } }),
    prisma.feedback.count({ where: { userId } }),
    prisma.userGamification.findUnique({ where: { userId } }),
    prisma.stock.count({ where: { userId, memo: { isNot: null } } }),
    // チェックリスト連続完了日数を計算
    (async () => {
      // CHECKLIST_COMPLETEのアクティビティログから連続日数を算出
      const logs = await prisma.xpActivityLog.findMany({
        where: { userId, actionType: 'CHECKLIST_COMPLETE' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
        take: 60, // 最大60日分
      })
      if (logs.length === 0) return 0
      // 日付の重複を除去して降順ソート
      const dates = [...new Set(logs.map(l => formatDateJST(l.createdAt)))].sort().reverse()
      const today = getTodayJST()
      let streak = 0
      for (let i = 0; i < dates.length; i++) {
        const expected = getJSTDateDaysAgo(i)
        // 初日は今日または昨日から開始可能
        if (i === 0 && dates[0] !== today) {
          const yesterday = getJSTDateDaysAgo(1)
          if (dates[0] !== yesterday) break
          // 昨日から開始
          const expectedFromYesterday = getJSTDateDaysAgo(i + 1)
          if (dates[i] === expectedFromYesterday) { streak++; continue }
          break
        }
        if (dates[i] === expected) { streak++ } else { break }
      }
      return streak
    })(),
  ])

  const data: TitleCheckData = {
    stockCount,
    memoCount,
    tagCount,
    distinctTagColorCount: tagColors.length,
    positionCount,
    realizedTradeCount: realizedTradeAgg._count.id,
    totalRealizedProfit: Number(realizedTradeAgg._sum.realizedPL ?? 0),
    dividendCount,
    benefitCount,
    eventCount,
    nextActionCount,
    snapshotCount,
    feedbackCount,
    level: gamification?.level ?? 1,
    longestStreak: gamification?.longestStreak ?? 0,
    allStocksHaveMemo: stockCount > 0 && stockCount === stocksWithMemoCount,
    checklistCompleteStreak,
  }

  const titles = evaluateTitles(data)
  const unlockedCount = titles.filter(t => t.unlocked).length
  const unlockedIds = titles.filter(t => t.unlocked).map(t => t.id)

  // 既存ユーザーマイグレーション: notifiedTitleIdsがnullなら獲得済みを全て通知済みとして登録
  let notifiedTitleIds = gamification?.notifiedTitleIds ?? null
  if (notifiedTitleIds === null && gamification) {
    await prisma.userGamification.update({
      where: { userId },
      data: { notifiedTitleIds: unlockedIds },
    })
    notifiedTitleIds = unlockedIds
  }

  return NextResponse.json({
    success: true,
    data: {
      titles,
      unlockedCount,
      totalCount: TOTAL_TITLE_COUNT,
      notifiedTitleIds: notifiedTitleIds ?? [],
    },
  })
}, '称号取得')

export const PATCH = withAuth(async ({ user, request }) => {
  const userId = user.id
  const { titleIds } = await request.json()

  if (!Array.isArray(titleIds) || !titleIds.every((id: unknown) => typeof id === 'string')) {
    return NextResponse.json({ success: false, error: '無効なtitleIds' }, { status: 400 })
  }

  const gamification = await prisma.userGamification.findUnique({ where: { userId } })
  if (!gamification) {
    return NextResponse.json({ success: false, error: 'ゲーミフィケーション未初期化' }, { status: 404 })
  }

  await prisma.userGamification.update({
    where: { userId },
    data: { notifiedTitleIds: titleIds },
  })

  return NextResponse.json({ success: true })
}, '通知済み称号更新')
