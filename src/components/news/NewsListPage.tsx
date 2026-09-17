'use client'

import { useNewsList, type NewsSource } from '@/hooks/news/useNewsList'
import { formatMonthDayJP } from '@/lib/dateFormat'

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const SOURCE_TABS: { value: NewsSource; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'diary', label: '日記' },
  { value: 'stock', label: '銘柄' },
]

interface NewsListPageProps {
  isOpen: boolean
}

export default function NewsListPage({ isOpen }: NewsListPageProps) {
  const { items, total, isLoading, hasMore, loadMore, source, setSource } = useNewsList(isOpen)

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
      <div className="flex gap-2 mb-4">
        {SOURCE_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setSource(tab.value)}
            className={`cursor-pointer text-xs px-3 py-1.5 rounded-full transition-colors ${
              source === tab.value
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
          <span className="text-4xl mb-4 block">📰</span>
          <h3 className="text-lg font-medium text-white mb-2">ニュースがまだありません</h3>
          <p className="text-gray-400 text-sm">
            {source === 'stock'
              ? '銘柄カードの基本タブからニュースクリップを追加できます'
              : source === 'diary'
              ? '投資日記の「気になったニュース」にURLを追加すると、ここに一覧表示されます'
              : '投資日記や銘柄カードからニュースを追加すると、ここに一覧表示されます'}
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-400 mb-4">
            全 {total} 件のニュース
          </div>

          <div className="space-y-2">
            {items.map(item => {
              const isDiary = 'diaryDate' in item && item.source !== 'stock'
              const isStock = 'symbol' in item

              return (
                <div
                  key={`${item.source ?? 'diary'}-${item.id}`}
                  className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-start gap-3"
                >
                  <span className="text-orange-400 text-sm mt-0.5 shrink-0">🔗</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                      >
                        {getDomain(item.url)}
                      </a>
                      {isDiary && 'diaryDate' in item && (
                        <span className="text-[10px] text-orange-400/70 bg-orange-400/10 px-1.5 py-0.5 rounded">
                          {formatMonthDayJP(item.diaryDate)}
                        </span>
                      )}
                      {isStock && 'symbol' in item && (
                        <span className="text-[10px] text-purple-400/70 bg-purple-400/10 px-1.5 py-0.5 rounded">
                          {item.symbol} {'stockName' in item && item.stockName ? item.stockName : ''}
                        </span>
                      )}
                    </div>
                    {item.comment && (
                      <p className="text-sm text-gray-300 mt-0.5">{item.comment}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5 truncate" title={item.url}>
                      {item.url}
                    </p>
                  </div>
                </div>
              )
            })}
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
