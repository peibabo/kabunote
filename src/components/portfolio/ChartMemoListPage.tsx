'use client'

import { useState } from 'react'
import { useChartMemoList } from '@/hooks/portfolio/useChartMemoList'
import { playSound } from '@/lib/sound'
import type { ChartMemoFilter, ChartMemoListItem } from '@/types/portfolio'

const CHART_TYPE_LABELS: Record<string, string> = {
  value: '評価額',
  netAssets: '純資産',
  profitLoss: '損益',
  stocks: '個別株',
}

const CHART_TYPE_COLORS: Record<string, string> = {
  value: 'text-blue-400/70 bg-blue-400/10',
  netAssets: 'text-green-400/70 bg-green-400/10',
  profitLoss: 'text-orange-400/70 bg-orange-400/10',
  stocks: 'text-purple-400/70 bg-purple-400/10',
}

const FILTER_TABS: { value: ChartMemoFilter; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'value', label: '評価額' },
  { value: 'netAssets', label: '純資産' },
  { value: 'profitLoss', label: '損益' },
  { value: 'stocks', label: '個別株' },
]

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`
}

interface ChartMemoListPageProps {
  isOpen: boolean
}

export default function ChartMemoListPage({ isOpen }: ChartMemoListPageProps) {
  const { items, total, isLoading, hasMore, loadMore, filter, setFilter, deleteItem } = useChartMemoList(isOpen)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (item: ChartMemoListItem) => {
    setDeletingId(item.id)
    const success = await deleteItem(item)
    if (success) {
      playSound('buttonDelete')
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
        <span className="ml-3 text-gray-400">読み込み中...</span>
      </div>
    )
  }

  return (
    <div>
      {/* フィルタータブ */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`cursor-pointer text-xs px-3 py-1.5 rounded-full transition-colors ${
              filter === tab.value
                ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30'
                : 'text-gray-400 hover:text-gray-300 border border-gray-700 hover:border-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-4xl mb-4 block">📝</span>
          <h3 className="text-lg font-medium text-white mb-2">チャートメモがまだありません</h3>
          <p className="text-gray-400 text-sm">
            {filter !== 'all'
              ? `「${CHART_TYPE_LABELS[filter]}」のチャートメモはまだありません`
              : 'ポートフォリオ推移グラフのデータポイントをクリックしてメモを追加できます'}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-400 mb-4">
            全 {total} 件のチャートメモ
          </div>

          <div className="space-y-2">
            {items.map(item => (
              <div
                key={item.id}
                className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-start gap-3"
              >
                <span className="text-orange-400 text-sm mt-0.5 shrink-0">📝</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-300">
                      {formatDateJP(item.snapshotDate)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CHART_TYPE_COLORS[item.chartType] || 'text-gray-400 bg-gray-700'}`}>
                      {CHART_TYPE_LABELS[item.chartType] || item.chartType}
                    </span>
                    {item.chartType === 'stocks' && item.symbol && (
                      <span className="text-[10px] text-purple-400/70 bg-purple-400/10 px-1.5 py-0.5 rounded">
                        {item.symbol}{item.stockName ? ` ${item.stockName}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white mt-1">{item.content}</p>
                </div>
                <div className="shrink-0 flex items-center">
                  {confirmDeleteId === item.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="cursor-pointer text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-400/30 transition-colors disabled:opacity-50"
                      >
                        {deletingId === item.id ? '...' : '削除'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="cursor-pointer text-xs text-gray-400 hover:text-gray-300 px-2 py-1 transition-colors"
                      >
                        戻る
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="cursor-pointer text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="削除"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* もっと読み込む */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="cursor-pointer text-sm text-orange-400 hover:text-orange-300 px-4 py-2 border border-orange-400/30 rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? '読み込み中...' : 'もっと読み込む'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
