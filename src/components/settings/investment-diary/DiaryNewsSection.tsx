'use client'

import { playSound } from '@/lib/sound'
import type { NewsItem } from '@/types/diary'

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

interface DiaryNewsSectionProps {
  newsItems: NewsItem[]
  newUrl: string
  newComment: string
  onNewUrlChange: (url: string) => void
  onNewCommentChange: (comment: string) => void
  onAddNews: () => void
  onRemoveNews: (index: number) => void
  onUpdateNewsItem: (index: number, field: 'url' | 'comment', value: string) => void
}

export default function DiaryNewsSection({
  newsItems,
  newUrl,
  newComment,
  onNewUrlChange,
  onNewCommentChange,
  onAddNews,
  onRemoveNews,
  onUpdateNewsItem,
}: DiaryNewsSectionProps) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
        <span>📰</span>
        <span>気になったニュース</span>
        {newsItems.length > 0 && (
          <span className="text-gray-600">({newsItems.length})</span>
        )}
      </label>

      {/* ニュースアイテムリスト */}
      {newsItems.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {newsItems.map((item, i) => (
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
                  onChange={e => onUpdateNewsItem(i, 'comment', e.target.value)}
                  placeholder="コメント..."
                  maxLength={500}
                  className="w-full bg-transparent text-xs text-gray-300 placeholder-gray-600 border-none outline-none mt-0.5"
                />
              </div>
              <button
                onClick={() => { onRemoveNews(i); playSound('buttonDelete') }}
                className="cursor-pointer text-gray-600 hover:text-red-400 text-xs shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 追加フォーム */}
      {newsItems.length < 20 && (
        <div className="space-y-1.5">
          <input
            type="url"
            value={newUrl}
            onChange={e => onNewUrlChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onAddNews() }}
            placeholder="https://..."
            className="w-full bg-gray-900/50 text-xs text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-2 py-1.5 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
          <div className="flex gap-1.5">
            <input
              type="text"
              value={newComment}
              onChange={e => onNewCommentChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onAddNews() }}
              placeholder="コメント（任意）"
              maxLength={500}
              className="flex-1 bg-gray-900/50 text-xs text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-2 py-1.5 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
            <button
              onClick={onAddNews}
              disabled={!newUrl.trim() || !/^https?:\/\/.+/.test(newUrl.trim())}
              className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
