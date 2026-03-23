'use client';

import type { NewsItem } from '@/types/diary';

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
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-orange-300">
        📰 ニュースクリップ
        {isNewsLoading ? (
          <span className="text-orange-400 ml-1">
            <span className="inline-block animate-spin h-3 w-3 border border-orange-400 border-t-transparent rounded-full align-middle" />
          </span>
        ) : newsItems.length > 0 ? (
          <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-bold leading-none">{newsItems.length}</span>
        ) : null}
      </span>
      <button
        onClick={onNewsDialogOpen}
        className="cursor-pointer text-xs text-orange-400 hover:text-orange-300 transition-colors"
      >
        管理
      </button>
    </div>
  );
}
