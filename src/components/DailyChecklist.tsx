'use client'

import { useChecklist } from '@/hooks/useChecklist'
import { CHECKLIST_ITEMS } from '@/types/checklist'
import { playSound } from '@/lib/sound'
import { useEffect, useRef } from 'react'

function StreakBadge({ days }: { days: number }) {
  if (days <= 0) return null

  let colorClass = 'text-blue-400'
  if (days >= 15) colorClass = 'text-orange-400'
  else if (days >= 8) colorClass = 'text-yellow-400'

  return (
    <span className={`${colorClass} text-sm font-medium`}>
      🔥 {days}日連続
    </span>
  )
}

export default function DailyChecklist() {
  const { checkedItems, streak, isLoading, toggleItem } = useChecklist()
  const prevAllCompleteRef = useRef(false)

  const completedCount = checkedItems.length
  const totalCount = CHECKLIST_ITEMS.length
  const allComplete = completedCount === totalCount
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  // 全完了時の演出
  useEffect(() => {
    if (allComplete && !prevAllCompleteRef.current && completedCount > 0) {
      playSound('buttonAction')
    }
    prevAllCompleteRef.current = allComplete
  }, [allComplete, completedCount])

  const handleToggle = (index: number) => {
    if (isLoading) return
    playSound('toggle')
    toggleItem(index)
  }

  if (isLoading) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-3">
        <div className="animate-pulse flex items-center gap-2">
          <div className="h-4 w-40 bg-gray-700 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg px-4 py-3">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${allComplete ? 'text-green-400' : 'text-gray-200'}`}>
          ✅ 今日の投資チェック
        </span>
        <StreakBadge days={streak.currentStreak} />
      </div>

      {/* プログレスバー */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: allComplete
                ? 'linear-gradient(90deg, #34d399, #10b981)'
                : 'linear-gradient(90deg, #3b82f6, #6366f1)',
            }}
          />
        </div>
        <span className={`text-xs whitespace-nowrap ${allComplete ? 'text-green-400' : 'text-gray-400'}`}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* チェックリスト */}
      <div className="space-y-1">
        {CHECKLIST_ITEMS.map((item, index) => {
          const checked = checkedItems.includes(index)
          return (
            <label
              key={index}
              className="flex items-center gap-2 cursor-pointer group py-0.5"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(index)}
                className="sr-only"
              />
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  checked
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'border-gray-600 group-hover:border-gray-400'
                }`}
              >
                {checked && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span
                className={`text-sm transition-colors ${
                  checked
                    ? 'text-gray-500 line-through'
                    : 'text-gray-300 group-hover:text-white'
                }`}
              >
                {item}
              </span>
            </label>
          )
        })}
      </div>

      {/* 全完了メッセージ */}
      {allComplete && (
        <p className="text-green-400 text-xs mt-2 text-center">
          🎉 今日のチェック完了！お疲れさまです
        </p>
      )}
    </div>
  )
}
