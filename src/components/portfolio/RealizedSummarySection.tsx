'use client';

import { useState } from 'react';
import { usePortfolioRealizedTrades } from '@/hooks/portfolio/useRealizedTrades';
import { useAccordionState } from '@/hooks/util/useAccordionState';
import { formatPrice, formatProfitLoss, formatShares } from '@/lib/positionCalc';
import { getTodayJST } from '@/lib/dateJst';

// JST基準の当年を起点に直近5年分の選択肢を作る
function buildYearOptions(): number[] {
  const currentYear = parseInt(getTodayJST().slice(0, 4), 10);
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
}

export default function RealizedSummarySection() {
  const yearOptions = buildYearOptions();
  const [year, setYear] = useState(yearOptions[0]);
  const { trades, summary, isLoading } = usePortfolioRealizedTrades(year);
  const { isExpanded, toggle } = useAccordionState();

  // データが一度も無ければセクション自体を出さない（当年に取引が無い場合のみ非表示判定が必要なので年フィルタ前の総数で判定したいが、簡潔さ優先で当年基準）
  if (!isLoading && trades.length === 0 && year === yearOptions[0]) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📜</span>
          <h3 className="text-sm font-medium text-gray-200">確定損益（{year}年）</h3>
          {summary.tradeCount > 0 && (
            <span className={`text-xs font-medium ${summary.totalGross >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatProfitLoss(summary.totalGross)}円
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4H4z" />
          </svg>
        </div>
      </button>

      <div className={`mt-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        {/* 年セレクタ */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {yearOptions.map(y => (
            <button
              key={y}
              onClick={() => setYear(y)}
              className={`cursor-pointer text-xs px-2.5 py-1 rounded transition-colors ${
                y === year ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {y}年
            </button>
          ))}
        </div>

        {/* 集計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">実現損益（税引前）</div>
            <div className={`text-lg font-medium ${summary.totalGross >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatProfitLoss(summary.totalGross)}円
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">実現損益（税引後）</div>
            <div className={`text-lg font-medium ${summary.totalAfterTax >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatProfitLoss(Math.round(summary.totalAfterTax))}円
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">取引回数</div>
            <div className="text-lg font-medium text-white">{summary.tradeCount}回</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-400 mb-1">勝率</div>
            <div className="text-lg font-medium text-blue-300">
              {summary.tradeCount > 0 ? Math.round((summary.winCount / summary.tradeCount) * 100) : 0}%
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{summary.winCount}勝 {summary.lossCount}敗</div>
          </div>
        </div>

        {/* 明細 */}
        {trades.length > 0 && (
          <div className="space-y-1.5">
            {trades.map(t => (
              <div key={t.id} className="bg-gray-700/60 rounded px-3 py-2 text-xs flex items-center justify-between">
                <span className="text-gray-300">
                  {t.sellDate} ・ {t.symbol} ・ {formatShares(t.soldShares)}株 @ {formatPrice(t.sellPrice)}円
                </span>
                <span className={t.realizedPL >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                  {formatProfitLoss(t.realizedPL)}円
                </span>
              </div>
            ))}
          </div>
        )}

        {!isLoading && trades.length === 0 && (
          <div className="text-xs text-gray-500 text-center py-3">{year}年の確定損益はありません</div>
        )}
      </div>
    </div>
  );
}
