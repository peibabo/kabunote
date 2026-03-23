'use client';

import type { NewsItem } from '@/types/diary';

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface StockNewsSectionProps {
  newsItems: NewsItem[];
  onNewsDialogOpen?: () => void;
  isNewsLoading: boolean;
}

export default function StockNewsSection({
  newsItems,
  onNewsDialogOpen,
  isNewsLoading,
}: StockNewsSectionProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-orange-300">
          📰 ニュースクリップ
          {newsItems.length > 0 && (
            <span className="text-gray-400 ml-1">({newsItems.length})</span>
          )}
        </span>
        <button
          onClick={onNewsDialogOpen}
          className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 transition-colors"
        >
          管理
        </button>
      </div>
      {isNewsLoading ? (
        <div className="flex items-center gap-1">
          <div className="animate-spin h-3 w-3 border border-orange-400 border-t-transparent rounded-full" />
          <span className="text-xs text-orange-400">読込中...</span>
        </div>
      ) : newsItems.length > 0 ? (
        <div className="space-y-1">
          {newsItems.slice(0, 3).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-orange-400 shrink-0">🔗</span>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 truncate"
                title={item.url}
              >
                {getDomain(item.url)}
              </a>
              {item.comment && (
                <span className="text-gray-400 truncate">{item.comment}</span>
              )}
            </div>
          ))}
          {newsItems.length > 3 && (
            <button
              onClick={onNewsDialogOpen}
              className="cursor-pointer text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              他 {newsItems.length - 3} 件...
            </button>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-600">クリップを追加するには「管理」をクリック</p>
      )}
    </div>
  );
}
