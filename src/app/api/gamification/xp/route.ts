import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import {
  XP_VALUES, XP_DESCRIPTIONS, DAILY_XP_CAP,
  xpForLevel, levelFromXp, LEVEL_NAMES, getStreakBonus,
} from '@/lib/gamification'
import { isTSEBusinessDayStr, getPreviousBusinessDayStr } from '@/lib/jpBusinessDay'
import { getTodayJST, formatDateJST, dateStrToUTCMidnight } from '@/lib/dateJst'
import type { XpActionType } from '@/types/gamification'

/** 日次1回制限のアクション */
const DAILY_ONCE_ACTIONS: XpActionType[] = ['LOGIN', 'MEMO_SAVE', 'CHECKLIST_COMPLETE', 'DIARY_SAVE']

export const POST = withAuth(async ({ user, request }) => {
  const { actionType } = await request.json() as { actionType: string }

  // バリデーション
  if (!actionType || !(actionType in XP_VALUES)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '無効なアクションタイプです' },
      { status: 400 }
    )
  }

  const xpAmount = XP_VALUES[actionType as XpActionType]
  const today = getTodayJST()

  // ゲーミフィケーション状態を取得/作成
  let gamification = await prisma.userGamification.upsert({
    where: { userId: user.id },
    create: { userId: user.id, dailyXpDate: dateStrToUTCMidnight(today) },
    update: {},
  })

  // daily_xp_date リセット判定
  const isNewDay = formatDateJST(gamification.dailyXpDate) !== today
  const currentDailyXp = isNewDay ? 0 : gamification.dailyXp

  // 日次1回制限チェック
  if (DAILY_ONCE_ACTIONS.includes(actionType as XpActionType)) {
    const existingToday = await prisma.xpActivityLog.findFirst({
      where: {
        userId: user.id,
        actionType,
        createdAt: { gte: dateStrToUTCMidnight(today) },
      },
    })
    if (existingToday) {
      return NextResponse.json({
        success: true,
        data: {
          xpEarned: 0,
          streakBonus: 0,
          leveledUp: false,
          dailyCapReached: false,
          totalXp: gamification.totalXp,
          level: gamification.level,
          dailyXp: currentDailyXp,
          currentStreak: gamification.currentStreak,
        },
      })
    }
  }

  // ストリーク更新（ログイン時のみ）
  let streakBonus = 0
  let newStreak = gamification.currentStreak
  let newLongestStreak = gamification.longestStreak

  if (actionType === 'LOGIN' && isNewDay) {
    const lastActive = gamification.lastActiveDate ? formatDateJST(gamification.lastActiveDate) : undefined

    if (isTSEBusinessDayStr(today)) {
      // 営業日: lastActiveが前営業日〜昨日の間にあればストリーク継続
      const previousBusinessDay = getPreviousBusinessDayStr(today)
      if (lastActive && lastActive >= previousBusinessDay && lastActive < today) {
        newStreak = gamification.currentStreak + 1
      } else if (lastActive !== today) {
        newStreak = 1
      }
    }
    // 非営業日: ストリーク変更なし（維持）

    newLongestStreak = Math.max(newLongestStreak, newStreak)
    streakBonus = getStreakBonus(newStreak)
  }

  // 日次上限チェック（ストリークボーナスは上限外）
  const effectiveXp = Math.min(xpAmount, DAILY_XP_CAP - currentDailyXp)
  if (effectiveXp <= 0 && streakBonus === 0) {
    return NextResponse.json({
      success: true,
      data: {
        xpEarned: 0,
        streakBonus: 0,
        leveledUp: false,
        dailyCapReached: true,
        totalXp: gamification.totalXp,
        level: gamification.level,
        dailyXp: currentDailyXp,
        currentStreak: newStreak,
      },
    })
  }

  const totalEarned = Math.max(0, effectiveXp) + streakBonus
  const newTotalXp = gamification.totalXp + totalEarned
  const newLevel = levelFromXp(newTotalXp)
  const leveledUp = newLevel > gamification.level

  // 状態更新（increment で原子的更新）
  gamification = await prisma.userGamification.update({
    where: { userId: user.id },
    data: {
      totalXp: newTotalXp,
      level: newLevel,
      dailyXp: (isNewDay ? 0 : currentDailyXp) + Math.max(0, effectiveXp),
      dailyXpDate: dateStrToUTCMidnight(today),
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastActiveDate: dateStrToUTCMidnight(today),
    },
  })

  // アクティビティログ記録
  await prisma.xpActivityLog.create({
    data: {
      userId: user.id,
      actionType,
      xpEarned: totalEarned,
      description: XP_DESCRIPTIONS[actionType as XpActionType],
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      xpEarned: totalEarned,
      streakBonus,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
      newLevelName: leveledUp ? (LEVEL_NAMES[newLevel] || null) : undefined,
      dailyCapReached: currentDailyXp + Math.max(0, effectiveXp) >= DAILY_XP_CAP,
      totalXp: gamification.totalXp,
      level: gamification.level,
      dailyXp: gamification.dailyXp,
      currentStreak: gamification.currentStreak,
    },
  })
}, 'XP付与')
