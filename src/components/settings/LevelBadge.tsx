'use client'

import { useGamification } from '@/hooks/auth/useGamification'
import { useTitles } from '@/hooks/auth/useTitles'

export default function LevelBadge() {
  const { gamification, isLoading } = useGamification()
  const { titles } = useTitles()

  if (isLoading || !gamification) return null

  const { level, levelName, totalXp, xpForCurrentLevel, xpForNextLevel, dailyXp, currentStreak } = gamification
  const isMaxLevel = level >= 20
  const progressXp = totalXp - xpForCurrentLevel
  const neededXp = xpForNextLevel - xpForCurrentLevel
  const progressPercent = isMaxLevel ? 100 : neededXp > 0 ? Math.min(100, (progressXp / neededXp) * 100) : 0
  const dailyPercent = Math.min(100, (dailyXp / 100) * 100)

  return (
    <div
      className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-2 animate-fade-in"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: 'rgb(168, 85, 247)',
        boxShadow: '-2px 0 8px rgba(168, 85, 247, 0.3)',
      }}
    >
      {/* レベル・ランク・XPプログレス */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* レベルバッジ */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-purple-400 font-bold text-sm">
            Lv.{level}
          </span>
          <span className="text-gray-300 text-xs">
            {levelName}
          </span>
        </div>

        {/* XPプログレスバー */}
        <div className="flex-1 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, rgb(59, 130, 246), rgb(168, 85, 247))',
                  boxShadow: '0 0 6px rgba(168, 85, 247, 0.4)',
                }}
              />
            </div>
            <span className="text-gray-400 text-xs shrink-0">
              {isMaxLevel ? 'MAX' : `${progressXp}/${neededXp}`}
            </span>
          </div>
        </div>

        {/* ストリーク・デイリーXP */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          {currentStreak > 0 && (
            <span className="text-orange-400">
              {currentStreak}日連続
            </span>
          )}
          {titles && (
            <span className="text-purple-400/70">
              {titles.unlockedCount}/{titles.totalCount}
            </span>
          )}
          <span className="text-gray-500">
            今日 {dailyXp}/100 XP
          </span>
          {/* デイリーXPミニバー */}
          <div className="w-12 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${dailyPercent}%`,
                background: dailyPercent >= 100 ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
