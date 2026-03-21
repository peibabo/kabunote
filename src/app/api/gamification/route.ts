import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { xpForLevel, levelFromXp, LEVEL_NAMES } from '@/lib/gamification'
import { getTodayJST, formatDateJST, dateStrToUTCMidnight } from '@/lib/dateJst'

export const GET = withAuth(async ({ user }) => {
  const today = getTodayJST()

  let gamification = await prisma.userGamification.findUnique({
    where: { userId: user.id },
  })

  // 初回アクセス時に自動作成
  if (!gamification) {
    gamification = await prisma.userGamification.create({
      data: { userId: user.id, dailyXpDate: dateStrToUTCMidnight(today) },
    })
  }

  // daily_xp_date が今日でない場合はリセット
  const gamificationDate = formatDateJST(gamification.dailyXpDate)
  if (gamificationDate !== today) {
    gamification = await prisma.userGamification.update({
      where: { userId: user.id },
      data: { dailyXp: 0, dailyXpDate: dateStrToUTCMidnight(today) },
    })
  }

  const level = gamification.level
  return NextResponse.json({
    success: true,
    data: {
      totalXp: gamification.totalXp,
      level,
      dailyXp: gamification.dailyXp,
      currentStreak: gamification.currentStreak,
      longestStreak: gamification.longestStreak,
      xpForCurrentLevel: xpForLevel(level),
      xpForNextLevel: xpForLevel(level + 1),
      levelName: LEVEL_NAMES[level] || LEVEL_NAMES[20],
      nextLevelName: level < 20 ? (LEVEL_NAMES[level + 1] || null) : null,
    },
  })
}, 'ゲーミフィケーション状態取得')
