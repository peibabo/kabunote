'use client'

import { useState, useMemo } from 'react'
import { useDiary } from '@/hooks/dashboard/useDiary'
import { useAccordionState } from '@/hooks/util/useAccordionState'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import { playSound } from '@/lib/sound'
import type { DiaryTextField } from '@/types/diary'

const TEXT_SECTIONS: { field: DiaryTextField; icon: string; title: string; placeholder: string }[] = [
  { field: 'marketOverview', icon: '📊', title: 'マーケット概況', placeholder: '日経平均、米国株の動向など...' },
  { field: 'reflection', icon: '🔍', title: '今日の振り返り', placeholder: '投資行動・判断の反省...' },
  { field: 'tomorrowFocus', icon: '🎯', title: '明日の注目ポイント', placeholder: '明日チェックすること...' },
]

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${days[d.getDay()]}）`
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** URLからドメイン名を取得 */
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function InvestmentDiary() {
  const {
    diary, selectedDate, diaryDates,
    isLoading, isSaving, lastSaved,
    updateField, changeDate,
    addNewsItem, removeNewsItem, updateNewsItem,
  } = useDiary()

  const { isExpanded, toggle } = useAccordionState({
    storageKey: STORAGE_KEYS.DIARY_EXPANDED,
    defaultExpanded: false,
  })

  const [newUrl, setNewUrl] = useState('')
  const [newComment, setNewComment] = useState('')

  const today = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])
  const isToday = selectedDate === today
  const isFutureDate = selectedDate > today

  const hasContent = diary.marketOverview || diary.newsItems.length > 0 || diary.reflection || diary.tomorrowFocus

  const borderColor = hasContent ? 'rgb(249, 115, 22)' : 'rgb(180, 83, 9)'
  const shadowColor = hasContent ? 'rgba(249, 115, 22, 0.3)' : 'rgba(180, 83, 9, 0.2)'

  const handleAddNews = () => {
    const url = newUrl.trim()
    if (!url) return
    if (!/^https?:\/\/.+/.test(url)) return
    if (diary.newsItems.length >= 20) return
    addNewsItem(url, newComment.trim())
    setNewUrl('')
    setNewComment('')
    playSound('buttonAction')
  }

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg animate-fade-in"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: borderColor,
        boxShadow: `-2px 0 8px ${shadowColor}`,
      }}
    >
      {/* ヘッダー */}
      <button
        onClick={toggle}
        className="cursor-pointer w-full flex items-center justify-between px-4 py-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📔</span>
          <span className="text-sm font-medium text-white">投資日記</span>
          {!isExpanded && (
            <span className="text-xs text-gray-500">
              {isToday ? '今日' : formatDateJP(selectedDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasContent && !isExpanded && (
            <span className="text-xs text-orange-400">記録あり</span>
          )}
          <span className={`text-gray-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* 展開時コンテンツ */}
      {isExpanded && (
        <div className="px-4 pb-3">
          {/* 日付ナビゲーション */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => changeDate(addDays(selectedDate, -1))}
              className="cursor-pointer text-gray-400 hover:text-white text-sm px-2 py-1 transition-colors"
            >
              ◀
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-200">
                {formatDateJP(selectedDate)}
              </span>
              {!isToday && (
                <button
                  onClick={() => changeDate(today)}
                  className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 px-2 py-0.5 border border-orange-400/30 rounded transition-colors"
                >
                  今日
                </button>
              )}
            </div>
            <button
              onClick={() => changeDate(addDays(selectedDate, 1))}
              disabled={isToday || isFutureDate}
              className="cursor-pointer text-gray-400 hover:text-white text-sm px-2 py-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ▶
            </button>
          </div>

          {/* 月のドット */}
          {diaryDates.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 justify-center">
              {diaryDates.map(d => (
                <button
                  key={d}
                  onClick={() => changeDate(d)}
                  className={`cursor-pointer w-6 h-6 rounded text-xs transition-colors ${
                    d === selectedDate
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                  }`}
                  title={formatDateJP(d)}
                >
                  {new Date(d + 'T00:00:00').getDate()}
                </button>
              ))}
            </div>
          )}

          {/* ローディング */}
          {isLoading ? (
            <div className="text-center py-4">
              <span className="text-gray-500 text-sm">読込中...</span>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {/* マーケット概況 */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <span>📊</span><span>マーケット概況</span>
                  </label>
                  <textarea
                    value={diary.marketOverview}
                    onChange={e => updateField('marketOverview', e.target.value)}
                    placeholder="日経平均、米国株の動向など..."
                    maxLength={2000}
                    rows={2}
                    className="w-full bg-gray-900/50 text-sm text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
                  />
                </div>

                {/* 気になったニュース（構造化） */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <span>📰</span>
                    <span>気になったニュース</span>
                    {diary.newsItems.length > 0 && (
                      <span className="text-gray-600">({diary.newsItems.length})</span>
                    )}
                  </label>

                  {/* ニュースアイテムリスト */}
                  {diary.newsItems.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      {diary.newsItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 bg-gray-900/30 rounded-md px-2 py-1.5">
                          <span className="text-xs text-orange-400 mt-0.5 shrink-0">🔗</span>
                          <div className="flex-1 min-w-0">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                              title={item.url}
                            >
                              {getDomain(item.url)}
                            </a>
                            <input
                              type="text"
                              value={item.comment}
                              onChange={e => updateNewsItem(i, 'comment', e.target.value)}
                              placeholder="コメント..."
                              maxLength={500}
                              className="w-full bg-transparent text-xs text-gray-300 placeholder-gray-600 border-none outline-none mt-0.5"
                            />
                          </div>
                          <button
                            onClick={() => { removeNewsItem(i); playSound('buttonDelete') }}
                            className="cursor-pointer text-gray-600 hover:text-red-400 text-xs shrink-0 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 追加フォーム */}
                  {diary.newsItems.length < 20 && (
                    <div className="space-y-1.5">
                      <input
                        type="url"
                        value={newUrl}
                        onChange={e => setNewUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddNews() }}
                        placeholder="https://..."
                        className="w-full bg-gray-900/50 text-xs text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-2 py-1.5 focus:outline-none focus:border-orange-500/50 transition-colors"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddNews() }}
                          placeholder="コメント（任意）"
                          maxLength={500}
                          className="flex-1 bg-gray-900/50 text-xs text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-2 py-1.5 focus:outline-none focus:border-orange-500/50 transition-colors"
                        />
                        <button
                          onClick={handleAddNews}
                          disabled={!newUrl.trim() || !/^https?:\/\/.+/.test(newUrl.trim())}
                          className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 残りのテキストセクション */}
                {TEXT_SECTIONS.filter(s => s.field !== 'marketOverview').map(({ field, icon, title, placeholder }) => (
                  <div key={field}>
                    <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                      <span>{icon}</span><span>{title}</span>
                    </label>
                    <textarea
                      value={diary[field]}
                      onChange={e => updateField(field, e.target.value)}
                      placeholder={placeholder}
                      maxLength={2000}
                      rows={2}
                      className="w-full bg-gray-900/50 text-sm text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-3 py-2 resize-none focus:outline-none focus:border-orange-500/50 transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* 保存状態インジケーター */}
              <div className="flex justify-end mt-2">
                <span className="text-xs text-gray-500">
                  {isSaving
                    ? '保存中...'
                    : lastSaved
                      ? `最終保存 ${lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
                      : '未保存'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
