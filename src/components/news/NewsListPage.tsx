'use client'

import { useNewsList } from '@/hooks/news/useNewsList'

function formatDateJP(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['日', '月', '火', '水', '木', '金', '土']
  return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

interface NewsListPageProps {
  isOpen: boolean
}

export default function NewsListPage({ isOpen }: NewsListPageProps) {
  const { items, total, isLoading, hasMore, loadMore } = useNewsList(isOpen)

  if (isLoading && items.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
        <span className="ml-3 text-gray-400">読み込み中...</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-4xl mb-4 block">📰</span>
        <h3 className="text-lg font-medium text-white mb-2">ニュースがまだありません</h3>
        <p className="text-gray-400 text-sm">
          投資日記の「気になったニュース」にURLを追加すると、ここに一覧表示されます
        </p>
      </div>
    )
  }

  // 日付ごとにグルーピング
  const grouped = new Map<string, typeof items>()
  for (const item of items) {
    const existing = grouped.get(item.diaryDate) ?? []
    existing.push(item)
    grouped.set(item.diaryDate, existing)
  }

  return (
    <div>
      <div className="text-sm text-gray-400 mb-4">
        全 {total} 件のニュース
      </div>

      <div className="space-y-4">
        {Array.from(grouped.entries()).map(([date, newsItems]) => (
          <div key={date}>
            <div className="text-xs text-orange-400 font-medium mb-2 sticky top-0 bg-gray-900 py-1">
              {formatDateJP(date)}
            </div>
            <div className="space-y-2">
              {newsItems.map(item => (
                <div
                  key={item.id}
                  className="bg-gray-800/50 rounded-lg px-3 py-2 flex items-start gap-3"
                >
                  <span className="text-orange-400 text-sm mt-0.5 shrink-0">🔗</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 hover:underline break-all"
                    >
                      {getDomain(item.url)}
                    </a>
                    {item.comment && (
                      <p className="text-sm text-gray-300 mt-0.5">{item.comment}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-0.5 truncate" title={item.url}>
                      {item.url}
                    </p>
                  </div>
                </div>
              ))}
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
    </div>
  )
}
