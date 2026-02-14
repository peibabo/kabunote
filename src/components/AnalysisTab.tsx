'use client';

import { PositionSummary, ProfitLossInfo, formatPrice, formatShares, formatProfitLoss } from '@/types/positions';

interface ProgressData {
  percentage: number;
  remainingToTarget: number;
  isOverTarget: boolean;
  isUnderStop: boolean;
}

interface AnalysisTabProps {
  symbol: string;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
  onTargetPriceChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  onCurrentPriceChange: (value: string) => void;
  positionSummary: PositionSummary;
  profitLossInfo: ProfitLossInfo | null;
}

// プログレスバー用の計算
const calculateProgress = (
  targetPrice: string,
  stopLoss: string,
  currentPrice: string
): ProgressData | null => {
  const target = parseFloat(targetPrice);
  const stop = parseFloat(stopLoss);
  const current = parseFloat(currentPrice);

  if (!target || !stop || !current) return null;

  // 損切ラインを0%、目標価格を100%として位置を計算
  const range = target - stop;
  const currentPosition = current - stop;
  const percentage = Math.max(0, Math.min(100, (currentPosition / range) * 100));

  // 目標までの残り
  const remainingToTarget = ((target - current) / (target - stop)) * 100;

  return {
    percentage,
    remainingToTarget: Math.max(0, remainingToTarget),
    isOverTarget: current > target,
    isUnderStop: current < stop
  };
};

export default function AnalysisTab({
  symbol,
  targetPrice,
  stopLoss,
  currentPrice,
  onTargetPriceChange,
  onStopLossChange,
  onCurrentPriceChange,
  positionSummary,
  profitLossInfo
}: AnalysisTabProps) {
  const progressData = calculateProgress(targetPrice, stopLoss, currentPrice);

  return (
    <div className="space-y-4">
      {/* 分析タブ: 投資規律・株価情報 */}
      {/* 目標株価・損切りライン */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">投資規律設定</h4>
        <div className="grid grid-cols-3 gap-3">
          {/* 損切ライン */}
          <div className="space-y-1">
            <label htmlFor={`stop-loss-${symbol}`} className="text-xs font-medium text-red-300">
              🔻 損切ライン
            </label>
            <div className="relative">
              <input
                id={`stop-loss-${symbol}`}
                type="number"
                value={stopLoss}
                onChange={(e) => onStopLossChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>

          {/* 現在の目安株価 */}
          <div className="space-y-1">
            <label htmlFor={`current-price-${symbol}`} className="text-xs font-medium text-blue-300">
              📈 現在の目安株価
            </label>
            <div className="relative">
              <input
                id={`current-price-${symbol}`}
                type="number"
                value={currentPrice}
                onChange={(e) => onCurrentPriceChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>

          {/* 利確目標 */}
          <div className="space-y-1">
            <label htmlFor={`target-price-${symbol}`} className="text-xs font-medium text-green-300">
              💰 利確目標
            </label>
            <div className="relative">
              <input
                id={`target-price-${symbol}`}
                type="number"
                value={targetPrice}
                onChange={(e) => onTargetPriceChange(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>
        </div>

        {/* 株価プログレスバーゲージ */}
        {progressData && targetPrice && stopLoss && currentPrice && (
          <div className="mt-4 p-3 bg-gray-600 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-medium text-gray-300">📊 株価ポジション</h5>
              <span className="text-xs text-gray-400">
                {progressData.isOverTarget
                  ? '🎯 利確目標達成!'
                  : progressData.isUnderStop
                    ? '⚠️ 損切ライン下'
                    : `利確目標まで${progressData.remainingToTarget.toFixed(1)}%`
                }
              </span>
            </div>

            {/* プログレスバー */}
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progressData.isOverTarget
                      ? 'bg-green-500'
                      : progressData.percentage < 30
                        ? 'bg-red-500'
                        : progressData.percentage < 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, progressData.percentage)}%` }}
                />
              </div>

              {/* 現在価格のドット */}
              <div
                className="absolute top-0 w-3 h-3 bg-blue-400 border-2 border-white rounded-full transform -translate-x-1.5"
                style={{
                  left: `${Math.min(100, Math.max(0, progressData.percentage))}%`,
                  transform: 'translateX(-50%) translateY(0)'
                }}
              />
            </div>

            {/* 価格ラベル */}
            <div className="flex justify-between items-center mt-2 text-xs">
              <div className="text-red-300">
                <span>🔻 {formatPrice(parseFloat(stopLoss))}円</span>
              </div>
              <div className="text-blue-300 font-medium">
                <span>📈 {formatPrice(parseFloat(currentPrice))}円</span>
              </div>
              <div className="text-green-300">
                <span>💰 {formatPrice(parseFloat(targetPrice))}円</span>
              </div>
            </div>
          </div>
        )}

        {/* 含み益・含み損表示 */}
        {profitLossInfo && positionSummary.totalShares > 0 && (
          <div className="mt-4 p-3 bg-gray-600 rounded-lg">
            <h5 className="text-xs font-medium text-gray-300 mb-2">📊 損益シミュレーション</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* 損切ラインでの損失 */}
              {stopLoss && (
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">損切ライン到達時</div>
                  <div className={`text-sm font-bold ${profitLossInfo.stopLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatProfitLoss(profitLossInfo.stopLoss)}円
                  </div>
                  <div className={`text-xs ${profitLossInfo.stopLossPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({profitLossInfo.stopLossPercent >= 0 ? '+' : ''}{profitLossInfo.stopLossPercent.toFixed(1)}%)
                  </div>
                </div>
              )}

              {/* 現在の目安株価での損益 */}
              {currentPrice && (() => {
                const current = parseFloat(currentPrice);
                if (!current) return null;

                const currentValue = positionSummary.totalShares * current;
                const currentProfitLoss = currentValue - positionSummary.totalCost;
                const currentProfitLossPercent = positionSummary.totalCost > 0
                  ? (currentProfitLoss / positionSummary.totalCost) * 100
                  : 0;

                return (
                  <div className="text-center bg-blue-900 bg-opacity-30 rounded-lg p-2">
                    <div className="text-xs text-blue-300 mb-1">現在の目安株価</div>
                    <div className={`text-sm font-bold ${currentProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatProfitLoss(currentProfitLoss)}円
                    </div>
                    <div className={`text-xs ${currentProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      ({currentProfitLoss >= 0 ? '+' : ''}{currentProfitLossPercent.toFixed(1)}%)
                    </div>
                  </div>
                );
              })()}

              {/* 目標価格での利益 */}
              {targetPrice && (
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">利確目標達成時</div>
                  <div className={`text-sm font-bold ${profitLossInfo.targetProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatProfitLoss(profitLossInfo.targetProfit)}円
                  </div>
                  <div className={`text-xs ${profitLossInfo.targetProfitPercent >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    ({profitLossInfo.targetProfitPercent >= 0 ? '+' : ''}{profitLossInfo.targetProfitPercent.toFixed(1)}%)
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400 text-center">
              平均取得価額: {formatPrice(positionSummary.averagePrice)}円 × {formatShares(positionSummary.totalShares)}株
            </div>
          </div>
        )}
      </div>
    </div>
  );
}