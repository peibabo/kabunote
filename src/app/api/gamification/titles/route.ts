import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { evaluateTitles, TOTAL_TITLE_COUNT } from '@/lib/titles'
import { getTodayJST, getJSTDateDaysAgo, formatDateJST } from '@/lib/dateJst'
import type { TitleCheckData } from '@/types/titles'

/** 称号判定用の集計SQLの結果（1行） */
type TitleCountsRow = Omit<TitleCheckData, 'level' | 'longestStreak' | 'allStocksHaveMemo' | 'checklistCompleteStreak'> & {
  stocksWithMemoCount: number
}

/** CHECKLIST_COMPLETE のアクティビティログからチェックリスト連続完了日数を算出する */
async function fetchChecklistCompleteStreak(userId: string): Promise<number> {
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
}

export const GET = withAuth(async ({ user }) => {
  const userId = user.id

  // 集計はSQL1本にまとめる。
  // 以前は Prisma の count を約15本 Promise.all していたが、1リクエストでDB往復が15回になり
  // Sentry の N+1 Query（KABUNOTE-WEB-V）として検知されていた。コネクションプールも圧迫する。
  const [[counts], gamification, checklistCompleteStreak] = await Promise.all([
    prisma.$queryRaw<TitleCountsRow[]>`
      WITH my_stocks AS (SELECT id FROM stocks WHERE user_id = ${userId})
      SELECT
        (SELECT COUNT(*) FROM my_stocks)::int AS "stockCount",
        (SELECT COUNT(*) FROM stock_memos WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "memoCount",
        (SELECT COUNT(*) FROM stock_tags WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "tagCount",
        (SELECT COUNT(DISTINCT color) FROM stock_tags WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "distinctTagColorCount",
        (SELECT COUNT(*) FROM stock_positions WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "positionCount",
        (SELECT COUNT(*) FROM realized_trades WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "realizedTradeCount",
        (SELECT COALESCE(SUM(realized_pl), 0) FROM realized_trades WHERE stock_id IN (SELECT id FROM my_stocks))::float8 AS "totalRealizedProfit",
        (SELECT COUNT(*) FROM stock_dividends WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "dividendCount",
        (SELECT COUNT(*) FROM stock_benefits WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "benefitCount",
        (SELECT COUNT(*) FROM stock_events WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "eventCount",
        (SELECT COUNT(*) FROM next_action_plans WHERE stock_id IN (SELECT id FROM my_stocks)
          AND (strategy_memo IS NOT NULL OR target_price IS NOT NULL OR target_shares IS NOT NULL))::int AS "nextActionCount",
        (SELECT COUNT(*) FROM portfolio_snapshots WHERE user_id = ${userId})::int AS "snapshotCount",
        (SELECT COUNT(*) FROM feedbacks WHERE user_id = ${userId})::int AS "feedbackCount",
        (SELECT COUNT(DISTINCT stock_id) FROM stock_memos WHERE stock_id IN (SELECT id FROM my_stocks))::int AS "stocksWithMemoCount"
    `,
    prisma.userGamification.findUnique({ where: { userId } }),
    fetchChecklistCompleteStreak(userId),
  ])

  const { stocksWithMemoCount, ...countFields } = counts
  const data: TitleCheckData = {
    ...countFields,
    level: gamification?.level ?? 1,
    longestStreak: gamification?.longestStreak ?? 0,
    allStocksHaveMemo: counts.stockCount > 0 && counts.stockCount === stocksWithMemoCount,
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
