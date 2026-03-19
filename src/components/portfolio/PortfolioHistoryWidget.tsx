'use client';

import { usePortfolioHistory } from '@/hooks/portfolio/usePortfolioHistory';
import { useChartMemos } from '@/hooks/portfolio/useChartMemos';
import { useAccordionState } from '@/hooks/util/useAccordionState';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import PortfolioHistory from '@/components/portfolio/PortfolioHistory';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function PortfolioHistoryWidget() {
  const { isExpanded, toggle } = useAccordionState({
    storageKey: STORAGE_KEYS.PORTFOLIO_HISTORY_EXPANDED,
    defaultExpanded: false,
  });

  const historyState = usePortfolioHistory();
  const { data, range, todayRecorded, isLoading } = historyState;
  const chartMemosState = useChartMemos(range);

  // ミニスパークライン用データ（直近30件）
  const sparkData = data.slice(-30).map(d => ({ value: d.totalValue }));
  const trendUp = sparkData.length >= 2
    ? sparkData[sparkData.length - 1].value >= sparkData[0].value
    : true;
  const trendColor = trendUp ? '#34d399' : '#f87171';

  // ネオン縦線の色（インディゴ系、記録済みなら緑系）
  const borderColor = todayRecorded ? 'rgb(34, 197, 94)' : 'rgb(99, 102, 241)';
  const shadowColor = todayRecorded ? 'rgba(34, 197, 94, 0.3)' : 'rgba(99, 102, 241, 0.3)';

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg mb-4 animate-fade-in"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: borderColor,
        boxShadow: `-2px 0 8px ${shadowColor}`,
      }}
    >
      {/* アコーディオンヘッダー */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-700/30 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h3 className="text-sm font-medium text-gray-200">
            ポートフォリオ推移
          </h3>

          {/* 記録ステータスバッジ */}
          {!isLoading && (
            todayRecorded ? (
              <span className="text-xs px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 border border-green-700/50">
                記録済
              </span>
            ) : (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-900/50 text-yellow-400 border border-yellow-700/50">
                未記録
              </span>
            )
          )}

          {/* ミニスパークライン（折りたたみ時 & データあり） */}
          {!isExpanded && sparkData.length >= 2 && (
            <div className="hidden sm:block ml-2">
              <ResponsiveContainer width={80} height={24}>
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={trendColor}
                    strokeWidth={1.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* データ件数（折りたたみ時） */}
          {!isExpanded && data.length > 0 && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              ({data.length}日分)
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
          ? 'max-h-[2000px] opacity-100'
          : 'max-h-0 opacity-0'
      }`}>
        <div className="px-3 pb-3">
          <PortfolioHistory
            {...historyState}
            memoMap={chartMemosState.memoMap}
            saveMemo={chartMemosState.saveMemo}
            deleteMemo={chartMemosState.deleteMemo}
          />
        </div>
      </div>
    </div>
  );
}
