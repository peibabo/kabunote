'use client'

import { useState } from 'react'
import { playSound } from '@/lib/sound'
import type { NewsItem } from '@/types/diary'

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

interface StockNewsDialogProps {
  symbol: string
  companyName: string
  newsItems: NewsItem[]
  onAdd: (url: string, comment: string) => void
  onRemove: (index: number) => void
  onUpdate: (index: number, field: 'url' | 'comment', value: string) => void
  isSaving: boolean
  lastSaved: Date | null
  onClose: () => void
}

export default function StockNewsDialog({
  symbol,
  companyName,
  newsItems,
  onAdd,
  onRemove,
  onUpdate,
  isSaving,
  lastSaved,
  onClose,
}: StockNewsDialogProps) {
  const [newUrl, setNewUrl] = useState('')
  const [newComment, setNewComment] = useState('')

  const handleAdd = () => {
    const url = newUrl.trim()
    if (!url || !/^https?:\/\/.+/.test(url)) return
    onAdd(url, newComment.trim())
    setNewUrl('')
    setNewComment('')
    playSound('buttonClick')
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[85vh] m-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              📰 銘柄ニュース
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {symbol} {companyName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isSaving && (
              <div className="flex items-center gap-1">
                <div className="animate-pulse h-2 w-2 bg-green-400 rounded-full" />
                <span className="text-xs text-green-400">保存中...</span>
              </div>
            )}
            {lastSaved && !isSaving && (
              <span className="text-xs text-gray-500">
                {lastSaved.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}に保存
              </span>
            )}
            <button
              onClick={onClose}
              className="cursor-pointer text-gray-400 hover:text-white text-xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ニュースリスト */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {newsItems.length === 0 && (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">📰</span>
              <p className="text-sm text-gray-400">まだニュースがありません</p>
              <p className="text-xs text-gray-500 mt-1">下のフォームからURLを追加してください</p>
            </div>
          )}
          {newsItems.map((item, i) => (
            <div key={i} className="flex items-start gap-2 bg-gray-900/50 rounded-lg px-3 py-2">
              <span className="text-sm text-orange-400 mt-0.5 shrink-0">🔗</span>
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 hover:underline truncate block"
                  title={item.url}
                >
                  {getDomain(item.url)}
                </a>
                <input
                  type="text"
                  value={item.comment}
                  onChange={e => onUpdate(i, 'comment', e.target.value)}
                  placeholder="コメント..."
                  maxLength={500}
                  className="w-full bg-transparent text-sm text-gray-300 placeholder-gray-600 border-none outline-none mt-1"
                />
                <p className="text-xs text-gray-600 mt-0.5 truncate" title={item.url}>
                  {item.url}
                </p>
              </div>
              <button
                onClick={() => { onRemove(i); playSound('buttonDelete') }}
                className="cursor-pointer text-gray-600 hover:text-red-400 text-sm shrink-0 transition-colors mt-0.5"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* 追加フォーム */}
        {newsItems.length < 20 && (
          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div className="text-xs text-gray-400 mb-1">
              ニュースを追加（{newsItems.length}/20）
            </div>
            <input
              type="url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              placeholder="https://..."
              className="w-full bg-gray-900/50 text-sm text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-3 py-2 focus:outline-none focus:border-orange-500/50 transition-colors"
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
                placeholder="コメント（任意）"
                maxLength={500}
                className="flex-1 bg-gray-900/50 text-sm text-gray-200 placeholder-gray-600 border border-gray-700/50 rounded-md px-3 py-2 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <button
                onClick={handleAdd}
                disabled={!newUrl.trim() || !/^https?:\/\/.+/.test(newUrl.trim())}
                className="cursor-pointer text-sm text-orange-400 hover:text-orange-300 px-4 py-2 border border-orange-400/30 rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                追加
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
