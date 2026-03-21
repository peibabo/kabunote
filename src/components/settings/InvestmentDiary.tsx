'use client'

import { useState, useMemo } from 'react'
import { useDiary } from '@/hooks/dashboard/useDiary'
import { useAccordionState } from '@/hooks/util/useAccordionState'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import { playSound } from '@/lib/sound'
import { getTodayJST } from '@/lib/dateJst'
import type { DiaryTextField } from '@/types/diary'
import DiaryDateNav from './investment-diary/DiaryDateNav'
import DiaryNewsSection from './investment-diary/DiaryNewsSection'

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

  const today = useMemo(() => getTodayJST(), [])
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
          <DiaryDateNav
            selectedDate={selectedDate}
            today={today}
            isToday={isToday}
            isFutureDate={isFutureDate}
            diaryDates={diaryDates}
            onChangeDate={changeDate}
          />

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

                {/* 気になったニュース */}
                <DiaryNewsSection
                  newsItems={diary.newsItems}
                  newUrl={newUrl}
                  newComment={newComment}
                  onNewUrlChange={setNewUrl}
                  onNewCommentChange={setNewComment}
                  onAddNews={handleAddNews}
                  onRemoveNews={removeNewsItem}
                  onUpdateNewsItem={updateNewsItem}
                />

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
