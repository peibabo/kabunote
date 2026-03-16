'use client';

import { usePortfolioHistory } from '@/hooks/usePortfolioHistory';
import { useAccordionState } from '@/hooks/useAccordionState';
import { playSound } from '@/lib/sound';
import PortfolioChart from '@/components/PortfolioChart';
import type { HistoryRange } from '@/types/portfolio';

const RANGE_OPTIONS: { key: HistoryRange; label: string }[] = [
  { key: '1W', label: '1W' },
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'ALL', label: 'ALL' },
];

export default function PortfolioHistory() {
  const { isExpanded, toggle } = useAccordionState();
  const {
    data,
    range,
    setRange,
    isLoading,
    isCreating,
    todayRecorded,
    error,
    createSnapshot,
  } = usePortfolioHistory();

  const handleSnapshot = async () => {
    const success = await createSnapshot();
    if (success) {
      playSound('noteSave');
      window.dispatchEvent(new Event('kabunote-snapshot-created'));
    }
  };

  return (
    <div className="mt-2">
      {/* アコーディオンヘッダー */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="text-sm font-medium text-gray-200">
            ポートフォリオ推移
          </h3>
          {!isExpanded && data.length > 0 && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({data.length}日分の記録)
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${
          isExpanded ? 'rotate-180' : 'rotate-0'
        }`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4H4z"/>
          </svg>
        </div>
      </button>

      {/* アコーディオンコンテンツ */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded
          ? 'max-h-[2000px] opacity-100 mt-2'
          : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-gray-750 rounded-lg p-4">
          {/* ヘッダー: 確定ボタン/ステータス + 期間タブ */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            {/* 確定ボタン or 記録済みステータス */}
            {todayRecorded ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-400 font-medium">
                  ✅ 本日の記録済み
                </span>
                <button
                  onClick={handleSnapshot}
                  disabled={isCreating}
                  className="text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? '更新中...' : '最新データで上書き'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleSnapshot}
                disabled={isCreating}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '記録中...' : '📸 今日の記録を確定'}
              </button>
            )}

            {/* 期間切替タブ */}
            <div className="flex gap-1">
              {RANGE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setRange(opt.key)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    range === opt.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-3 px-3 py-2 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* グラフ */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              読み込み中...
            </div>
          ) : (
            <PortfolioChart data={data} />
          )}
        </div>
      </div>
    </div>
  );
}
