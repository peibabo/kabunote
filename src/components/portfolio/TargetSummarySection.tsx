'use client';

import { useState } from 'react';
import { PortfolioTargetSummary } from '@/types/positions';
import { formatProfitLoss } from '@/lib/positionCalc';

interface TargetSummarySectionProps {
  targetSummary: PortfolioTargetSummary;
  isTargetSummaryExpanded: boolean;
  toggleTargetSummary: () => void;
}

export default function TargetSummarySection({
  targetSummary,
  isTargetSummaryExpanded,
  toggleTargetSummary,
}: TargetSummarySectionProps) {
  const [isRiskRewardExpanded, setIsRiskRewardExpanded] = useState(false);

  if (targetSummary.targetSetCount === 0 && targetSummary.stopLossSetCount === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      {/* アコーディオンヘッダー */}
      <button
        onClick={toggleTargetSummary}
        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h3 className="text-sm font-medium text-gray-200">
            損益目標サマリー
          </h3>
          <span className="text-xs text-gray-400 hidden sm:inline">
            ({targetSummary.targetSetCount + targetSummary.stopLossSetCount}/{targetSummary.totalStocksWithPosition}銘柄で設定済み)
          </span>
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${
          isTargetSummaryExpanded ? 'rotate-180' : 'rotate-0'
        }`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4H4z"/>
          </svg>
        </div>
      </button>

      {/* アコーディオンコンテンツ */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isTargetSummaryExpanded
          ? 'max-h-[2000px] opacity-100'
          : 'max-h-0 opacity-0'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 利確目標合計 */}
          {targetSummary.targetSetCount > 0 && (
            <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4 text-center">
              <div className="text-xs text-green-300 mb-2">利確目標達成時</div>
              <div className="text-xl font-medium text-green-300">
                {formatProfitLoss(targetSummary.totalTargetProfit)}円
              </div>
              {targetSummary.totalTargetProfit > 0 && (
                <div className="text-sm text-green-200 mt-1">
                  税引後 {formatProfitLoss(Math.round(targetSummary.totalTargetProfit * 0.79685))}円
                </div>
              )}
              <div className="text-sm text-green-400 mt-1">
                {targetSummary.targetSetCount}銘柄で設定
              </div>
            </div>
          )}

          {/* 損切り合計 */}
          {targetSummary.stopLossSetCount > 0 && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 text-center">
              <div className="text-xs text-red-300 mb-2">損切り実行時</div>
              <div className="text-xl font-medium text-red-300">
                {formatProfitLoss(targetSummary.totalStopLoss)}円
              </div>
              <div className="text-sm text-red-400 mt-1">
                {targetSummary.stopLossSetCount}銘柄で設定
              </div>
            </div>
          )}

          {/* リスクリワード比（クリッカブル） */}
          {targetSummary.riskRewardRatio !== null && (
            <button
              onClick={() => setIsRiskRewardExpanded(!isRiskRewardExpanded)}
              className="cursor-pointer bg-blue-900 bg-opacity-30 border border-blue-700 hover:border-blue-600 rounded-lg p-4 w-full transition-all duration-200 hover:bg-blue-800 hover:bg-opacity-30"
            >
              <div className="text-xs text-blue-300 mb-2">リスクリワード比</div>
              <div className="text-xl font-medium text-blue-300">
                {targetSummary.riskRewardRatio.toFixed(2)}
              </div>
              <div className="text-sm text-blue-400 mt-1 flex items-center justify-center gap-2">
                <span>
                  {targetSummary.riskRewardRatio >= 2 ? '良好' :
                   targetSummary.riskRewardRatio >= 1 ? '適正' : 'リスク高'}
                </span>
                <div className={`transform transition-transform duration-200 ${
                  isRiskRewardExpanded ? 'rotate-180' : 'rotate-0'
                }`}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 6l4 4 4-4H4z"/>
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* ネオンライトリスクリワードプログレスバー（アコーディオン） */}
        {targetSummary.riskRewardRatio !== null && (
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isRiskRewardExpanded
              ? 'max-h-96 opacity-100 mt-4'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg">⚡</span>
                <h4 className="text-lg font-semibold text-white">リスクリワード可視化</h4>
                <span className="text-xs text-gray-400">
                  ポートフォリオ全体の損益バランス
                </span>
              </div>

              {/* プログレスバー */}
              <div className="relative">
                <div className="w-full h-6 bg-gradient-to-r from-red-900 via-gray-800 to-green-900 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-green-500/20 rounded-full"></div>

                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white transform -translate-x-0.5">
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 animate-pulse"
                         style={{
                           boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)'
                         }}></div>
                  </div>

                  {(() => {
                    const ratio = targetSummary.riskRewardRatio!;
                    const maxRatio = 3;
                    const position = Math.min(100, Math.max(0,
                      50 + ((ratio - 1) / (maxRatio - 1)) * 50
                    ));

                    return (
                      <div
                        className="absolute top-0 h-full w-1 transform -translate-x-0.5 transition-all duration-1000"
                        style={{
                          left: `${position}%`,
                          background: ratio >= 2
                            ? 'linear-gradient(to bottom, #10b981, #059669)'
                            : ratio >= 1.5
                            ? 'linear-gradient(to bottom, #f59e0b, #d97706)'
                            : 'linear-gradient(to bottom, #ef4444, #dc2626)',
                          boxShadow: ratio >= 2
                            ? '0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4)'
                            : ratio >= 1.5
                            ? '0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4)'
                            : '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <div
                          className="absolute -top-1 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 animate-pulse"
                          style={{
                            background: ratio >= 2
                              ? 'linear-gradient(to bottom, #10b981, #059669)'
                              : ratio >= 1.5
                              ? 'linear-gradient(to bottom, #f59e0b, #d97706)'
                              : 'linear-gradient(to bottom, #ef4444, #dc2626)',
                            boxShadow: ratio >= 2
                              ? '0 0 15px rgba(16, 185, 129, 1), 0 0 30px rgba(16, 185, 129, 0.6)'
                              : ratio >= 1.5
                              ? '0 0 15px rgba(245, 158, 11, 1), 0 0 30px rgba(245, 158, 11, 0.6)'
                              : '0 0 15px rgba(239, 68, 68, 1), 0 0 30px rgba(239, 68, 68, 0.6)'
                          }}
                        ></div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center mt-3 text-xs">
                  <div className="text-red-300 font-medium flex flex-col items-center">
                    <span>🔻 高リスク</span>
                    <span className="text-red-400 mt-1">0:1</span>
                  </div>
                  <div className="text-white font-medium flex flex-col items-center">
                    <span>⚖️ 取得価格</span>
                    <span className="text-gray-300 mt-1">基準点</span>
                  </div>
                  <div className="text-green-300 font-medium flex flex-col items-center">
                    <span>💰 安全ゾーン</span>
                    <span className="text-green-400 mt-1">3:1+</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {targetSummary.riskRewardRatio!.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium ${
                    targetSummary.riskRewardRatio! >= 2
                      ? 'text-green-400'
                      : targetSummary.riskRewardRatio! >= 1.5
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                    {targetSummary.riskRewardRatio! >= 2
                      ? '🟢 優秀なリスクリワード比'
                      : targetSummary.riskRewardRatio! >= 1.5
                      ? '🟡 適正なリスクリワード比'
                      : '🔴 リスクが高い設定です'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    利益可能性 vs 損失リスクの比率
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
