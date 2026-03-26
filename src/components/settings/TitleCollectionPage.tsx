'use client'

import { useTitles } from '@/hooks/auth/useTitles'
import type { TitleStatus, TitleCategory } from '@/types/titles'
import { TITLE_CATEGORY_INFO } from '@/types/titles'

const RARITY_STYLES = {
  common: { border: 'border-gray-600', text: 'text-gray-300', glow: '', label: 'Common', labelColor: 'text-gray-400' },
  rare: { border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-[0_0_6px_rgba(59,130,246,0.3)]', label: 'Rare', labelColor: 'text-blue-400' },
  epic: { border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-[0_0_6px_rgba(168,85,247,0.3)]', label: 'Epic', labelColor: 'text-purple-400' },
  legendary: { border: 'border-amber-400/50', text: 'text-amber-300', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.4)]', label: 'Legendary', labelColor: 'text-amber-400' },
}

const CATEGORY_ORDER: TitleCategory[] = ['stock', 'record', 'asset', 'strategy', 'streak', 'contribution']

function TitleCard({ title }: { title: TitleStatus }) {
  const style = RARITY_STYLES[title.rarity]

  return (
    <div
      className={`
        relative rounded-xl border p-4 transition-all duration-300
        ${title.unlocked
          ? `${style.border} ${style.glow} bg-gray-800/60`
          : 'border-gray-700/30 bg-gray-800/20 opacity-50'
        }
      `}
    >
      {/* レアリティバッジ */}
      <span className={`absolute top-2 right-2 text-[10px] font-medium ${title.unlocked ? style.labelColor : 'text-gray-600'}`}>
        {style.label}
      </span>

      <div className="flex items-start gap-3">
        {/* アイコン */}
        <span className={`text-3xl ${title.unlocked ? '' : 'grayscale'}`}>
          {title.icon}
        </span>

        <div className="flex-1 min-w-0">
          {/* 称号名 */}
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-sm ${title.unlocked ? style.text : 'text-gray-500'}`}>
              {title.name}
            </span>
            {title.unlocked ? (
              <span className="text-green-400 text-xs">&#x2714;</span>
            ) : (
              <span className="text-gray-600 text-xs">&#x1F512;</span>
            )}
          </div>

          {/* 説明 */}
          <p className={`text-xs mt-0.5 ${title.unlocked ? 'text-gray-400' : 'text-gray-600'}`}>
            {title.description}
          </p>

          {/* ヒント（未獲得時のみ） */}
          {!title.unlocked && (
            <p className="text-xs mt-1 text-gray-500 italic">
              💡 {title.hint}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TitleCollectionPage() {
  const { titles, isLoading } = useTitles()

  if (isLoading || !titles) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">読み込み中...</div>
      </div>
    )
  }

  const { titles: titleList, unlockedCount, totalCount } = titles
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0

  const grouped = CATEGORY_ORDER.map(cat => {
    const catTitles = titleList.filter(t => t.category === cat)
    const catUnlocked = catTitles.filter(t => t.unlocked).length
    return {
      category: cat,
      info: TITLE_CATEGORY_INFO[cat],
      titles: catTitles,
      unlockedCount: catUnlocked,
    }
  })

  return (
    <div className="space-y-6">
      {/* 全体進捗 */}
      <div>
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>コレクション進捗</span>
          <span className="font-medium">{unlockedCount}/{totalCount}</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
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

      {/* カテゴリ別セクション */}
      {grouped.map(({ category, info, titles: catTitles, unlockedCount: catUnlocked }) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{info.icon}</span>
            <span className="text-sm font-medium text-gray-300">{info.label}</span>
            <span className="text-xs text-gray-500">{catUnlocked}/{catTitles.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {catTitles.map(title => (
              <TitleCard key={title.id} title={title} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
