'use client';

import { OverallSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { formatPrice } from '@/lib/positionCalc';

interface CashPositionSectionProps {
  overallSummary: OverallSummary;
  cashAmount: string;
  nextActionMemo: string;
  updateCash: (value: string) => void;
  updateNextActionMemo: (value: string) => void;
  isCashSectionExpanded: boolean;
  toggleCashSection: () => void;
}

export default function CashPositionSection({
  overallSummary,
  cashAmount,
  nextActionMemo,
  updateCash,
  updateNextActionMemo,
  isCashSectionExpanded,
  toggleCashSection,
}: CashPositionSectionProps) {
  return (
    <div className="mt-2">
      {/* アコーディオンヘッダー */}
      <button
        onClick={toggleCashSection}
        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💼</span>
          <h3 className="text-sm font-medium text-gray-200">
            余力現金・キャッシュポジション
          </h3>
          {!isCashSectionExpanded && overallSummary.cashAmount > 0 && (
            <span className="text-xs font-medium text-yellow-300 hidden sm:inline">
              {formatPrice(overallSummary.cashAmount)}円（現金{overallSummary.cashRatio.toFixed(1)}%）
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${
          isCashSectionExpanded ? 'rotate-180' : 'rotate-0'
        }`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4H4z"/>
          </svg>
        </div>
      </button>

      {/* アコーディオンコンテンツ */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isCashSectionExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="space-y-2 mb-2">
            {/* 現金入力行 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-300 whitespace-nowrap">投資余力現金:</label>
                <input
                  type="text"
                  value={cashAmount}
                  onChange={(e) => updateCash(e.target.value)}
                  placeholder="0"
                  className="w-28 text-lg bg-gray-600 border border-gray-500 rounded px-2 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-right"
                />
                <span className="text-xs text-gray-400">円</span>
              </div>

              {/* Total Assets表示（現金が設定されている場合） */}
              {overallSummary.cashAmount > 0 && (
                <div className="text-xs font-medium text-yellow-300 whitespace-nowrap">
                  総資産: <span className="text-lg font-normal">{formatPrice(overallSummary.totalAssets)}</span> 円
                </div>
              )}
            </div>

            {/* Next Action メモ */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-center gap-1 sm:gap-2">
              <label className="text-xs font-semibold text-gray-300 whitespace-nowrap">Next Action メモ:</label>
              <input
                type="text"
                value={nextActionMemo}
                onChange={(e) => updateNextActionMemo(e.target.value)}
                placeholder="この余力現金は○○株が◯円になったときに買い増しする"
                maxLength={100}
                className="w-full sm:flex-1 max-w-2xl text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* キャッシュポジション可視化（現金が設定されている場合のみプログレスバー表示） */}
          {overallSummary.cashAmount > 0 && (
            <>
              {/* 比率表示 */}
              <div className="flex justify-between items-center text-xs font-medium mb-1">
                <span className="text-blue-300">
                  株式: {overallSummary.stockRatio.toFixed(1)}%
                </span>
                <span className="text-green-400">
                  現金: {overallSummary.cashRatio.toFixed(1)}%
                </span>
              </div>

              {/* 極細プログレスバー */}
              <div className="relative mb-2">
                <div className="w-full h-1 bg-green-400 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${overallSummary.stockRatio}%`,
                      background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                      boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                    }}
                  ></div>
                </div>
              </div>
            </>
          )}

          {/* 現金比率評価（常に表示） */}
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              <span className="text-sm">{overallSummary.cashRatioEvaluation.icon}</span>
              <span className={`text-xs font-medium ${overallSummary.cashRatioEvaluation.color}`}>
                {overallSummary.cashAmount === 0 ? 'ポートフォリオ分析' : '現金比率評価'}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-snug">
              {overallSummary.cashRatioEvaluation.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
