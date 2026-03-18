'use client'

import type { TitleStatus, TitleCategory } from '@/types/titles'
import { TITLE_CATEGORY_INFO } from '@/types/titles'

const RARITY_STYLES = {
  common: { border: 'border-gray-600', text: 'text-gray-300', glow: '' },
  rare: { border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-[0_0_6px_rgba(59,130,246,0.3)]' },
  epic: { border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-[0_0_6px_rgba(168,85,247,0.3)]' },
  legendary: { border: 'border-amber-400/50', text: 'text-amber-300', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]' },
}

interface TitleCollectionProps {
  titles: TitleStatus[]
  unlockedCount: number
  totalCount: number
}

export default function TitleCollection({ titles, unlockedCount, totalCount }: TitleCollectionProps) {
  // カテゴリ順序
  const categoryOrder: TitleCategory[] = ['stock', 'record', 'asset', 'strategy', 'streak', 'contribution']
  const grouped = categoryOrder.map(cat => ({
    category: cat,
    info: TITLE_CATEGORY_INFO[cat],
    titles: titles.filter(t => t.category === cat),
  }))

  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-3">
      {/* 進捗バー */}
      <div className="px-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>コレクション進捗</span>
          <span>{unlockedCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: progressPercent >= 100
                ? 'linear-gradient(90deg, rgb(251, 191, 36), rgb(245, 158, 11))'
                : 'linear-gradient(90deg, rgb(59, 130, 246), rgb(168, 85, 247))',
              boxShadow: progressPercent >= 100
                ? '0 0 8px rgba(251, 191, 36, 0.4)'
                : '0 0 6px rgba(168, 85, 247, 0.4)',
            }}
          />
        </div>
      </div>

      {/* カテゴリ別称号リスト */}
      <div className="space-y-3 max-h-64 overflow-y-auto px-3">
        {grouped.map(({ category, info, titles: catTitles }) => (
          <div key={category}>
            <div className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
              <span>{info.icon}</span>
              <span>{info.label}</span>
            </div>
            <div className="space-y-1">
              {catTitles.map(title => {
                const style = RARITY_STYLES[title.rarity]
                return (
                  <div
                    key={title.id}
                    className={`
                      flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs
                      transition-all duration-300
                      ${title.unlocked
                        ? `${style.border} ${style.glow} bg-gray-800/60`
                        : 'border-gray-700/30 bg-gray-800/20 opacity-40'
                      }
                    `}
                  >
                    <span className={title.unlocked ? '' : 'grayscale'}>
                      {title.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={title.unlocked ? style.text : 'text-gray-500'}>
                        {title.name}
                      </span>
                    </div>
                    {title.unlocked ? (
                      <span className="text-green-400 text-[10px] shrink-0">&#x2714;</span>
                    ) : (
                      <span className="text-gray-600 text-[10px] shrink-0">&#x1F512;</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
