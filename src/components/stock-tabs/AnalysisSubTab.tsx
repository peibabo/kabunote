'use client';

import { PositionSummary, ProfitLossInfo } from '@/types/positions';
import { formatPrice, formatShares, formatProfitLoss } from '@/lib/positionCalc';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';
import StockMiniChart from '@/components/stock/StockMiniChart';

interface ProgressData {
  percentage: number;
  remainingToTarget: number;
  isOverTarget: boolean;
  isUnderStop: boolean;
}

interface AnalysisSubTabProps {
  symbol: string;
  stockId?: string;
  targetPrice: string;
  stopLoss: string;
  currentPrice: string;
  onTargetPriceChange: (value: string) => void;
  onStopLossChange: (value: string) => void;
  onCurrentPriceChange: (value: string) => void;
  onPriceBlur?: () => void;
  positionSummary: PositionSummary;
  profitLossInfo: ProfitLossInfo | null;
}

// 個別銘柄のリスクリワード比を計算
const calculateRiskRewardRatio = (
  profitLossInfo: ProfitLossInfo | null
): number | null => {
  if (!profitLossInfo) return null;

  const { targetProfit, stopLoss: stopLossAmount } = profitLossInfo;

  // 損失額が0以下でない場合（実際に損失がある場合）のみ計算
  if (stopLossAmount >= 0) return null;

  // 利益額 ÷ 損失額の絶対値
  return Math.abs(targetProfit / stopLossAmount);
};

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

export default function AnalysisSubTab({
  symbol,
  stockId,
  targetPrice,
  stopLoss,
  currentPrice,
  onTargetPriceChange,
  onStopLossChange,
  onCurrentPriceChange,
  onPriceBlur,
  positionSummary,
  profitLossInfo
}: AnalysisSubTabProps) {
  const progressData = calculateProgress(targetPrice, stopLoss, currentPrice);
  const riskRewardRatio = calculateRiskRewardRatio(profitLossInfo);

  const onChangeSound = useSoundOnChange();

  return (
    <div className="space-y-4">
      {/* 投資規律設定 */}
      <div className="space-y-3">
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
                onChange={(e) => { onStopLossChange(e.target.value); onChangeSound(); }}
                onBlur={onPriceBlur}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none text-base md:text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>

          {/* 現在の株価 */}
          <div className="space-y-1">
            <label htmlFor={`current-price-${symbol}`} className="text-xs font-medium text-blue-300">
              📈 現在の株価
            </label>
            <div className="relative">
              <input
                id={`current-price-${symbol}`}
                type="number"
                value={currentPrice}
                onChange={(e) => { onCurrentPriceChange(e.target.value); onChangeSound(); }}
                onBlur={onPriceBlur}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-base md:text-sm pr-8"
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
                onChange={(e) => { onTargetPriceChange(e.target.value); onChangeSound(); }}
                onBlur={onPriceBlur}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none text-base md:text-sm pr-8"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
            </div>
          </div>
        </div>

        {/* ネオンライト株価プログレスバーゲージ・損益分析統合セクション */}
        {progressData && targetPrice && stopLoss && currentPrice && (
          <div className="mt-2 p-2 md:mt-4 md:p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-1 md:mb-2">
              <h5 className="text-xs md:text-sm font-medium text-gray-200 whitespace-nowrap">⚡ 株価ポジション・損益分析</h5>
              <span className="text-xs text-gray-400">
                {progressData.isOverTarget
                  ? '🎯 利確目標達成!'
                  : progressData.isUnderStop
                    ? '⚠️ 損切ライン下'
                    : `利確目標まで${progressData.remainingToTarget.toFixed(1)}%`
                }
              </span>
            </div>
            {positionSummary.averagePrice > 0 && (
              <div className="text-xs text-gray-400 text-center mb-1">
                平均取得価額: {formatPrice(positionSummary.averagePrice)}円 ({formatShares(positionSummary.totalShares)}株)
              </div>
            )}

            {/* ネオンライトプログレスバー */}
            <div className="relative">
              {/* バー背景 */}
              <div className="w-full h-6 relative">
                <div className="w-full h-full bg-gradient-to-r from-red-900 via-gray-800 to-green-900 rounded-full relative overflow-hidden">
                  {/* グロー効果のオーバーレイ */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-green-500/20 rounded-full"></div>
                </div>

                {/* 中央の取得単価ライン */}
                {positionSummary.averagePrice > 0 && (
                  (() => {
                    const stopPrice = parseFloat(stopLoss);
                    const targetPriceNum = parseFloat(targetPrice);
                    const avgPrice = positionSummary.averagePrice;

                    const range = targetPriceNum - stopPrice;
                    const avgPosition = range > 0 ? ((avgPrice - stopPrice) / range) * 100 : 50;
                    const avgPosClamp = Math.max(5, Math.min(95, avgPosition));

                    return (
                      <div
                        className="absolute top-0 w-0.5 h-full bg-white transform -translate-x-0.5 group/avg cursor-pointer"
                        style={{ left: `${avgPosClamp}%` }}
                      >
                        <div
                          className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 animate-pulse"
                          style={{
                            boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)'
                          }}
                        ></div>
                        {/* ツールチップ */}
                        <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 hidden group-hover/avg:block bg-gray-800 border border-gray-600 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          平均取得価額: {formatPrice(avgPrice)}円
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 現在株価の位置インジケーター（青色統一） */}
                <div
                  className="absolute top-0 h-full w-1 transform -translate-x-0.5 transition-all duration-1000 group/current cursor-pointer"
                  style={{
                    left: `${Math.min(95, Math.max(1, progressData.percentage))}%`,
                    background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)'
                  }}
                >
                  {/* 現在価格のネオンドット（青色統一） */}
                  <div
                    className="absolute -top-1 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 animate-pulse"
                    style={{
                      background: 'linear-gradient(to bottom, #3b82f6, #1d4ed8)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 1), 0 0 30px rgba(59, 130, 246, 0.6)'
                    }}
                  ></div>
                  {/* ツールチップ */}
                  <div className="absolute -top-9 left-1/2 transform -translate-x-1/2 hidden group-hover/current:block bg-gray-800 border border-blue-600 text-blue-300 text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                    現在株価: {formatPrice(parseFloat(currentPrice))}円
                  </div>
                </div>
              </div>
              {/* ステータス + 損益統合行 */}
              {positionSummary.averagePrice > 0 ? (() => {
                const current = parseFloat(currentPrice);
                const statusColor = progressData.isOverTarget ? 'text-green-400' : progressData.percentage < 30 ? 'text-red-400' : progressData.percentage < 70 ? 'text-yellow-400' : 'text-green-400';
                const statusText = progressData.isOverTarget ? '🎯 目標達成' : progressData.isUnderStop ? '💥 損切ライン超過' : progressData.percentage < 30 ? '⚠️ 危険ゾーン' : progressData.percentage < 70 ? '📊 中間ゾーン' : '🚀 好調ゾーン';

                if (!current) {
                  return <div className={`text-xs text-center mt-1 ${statusColor}`}>{statusText}</div>;
                }

                const currentValue = positionSummary.totalShares * current;
                const currentProfitLoss = currentValue - positionSummary.totalCost;
                const diff = current - positionSummary.averagePrice;
                const diffPercent = positionSummary.averagePrice !== 0 ? (diff / positionSummary.averagePrice) * 100 : 0;
                const plColor = currentProfitLoss >= 0 ? 'text-green-400' : 'text-red-400';

                return (
                  <div className="text-center mt-1">
                    <div className={`text-xs ${statusColor}`}>{statusText}</div>
                    <div className="mt-0.5">
                      <span className={`text-sm md:text-base font-bold ${plColor}`}>
                        {formatProfitLoss(currentProfitLoss)}円
                      </span>
                      <span className={`text-xs ${diff >= 0 ? 'text-green-200' : 'text-red-300'} ml-1`}>
                        ({diff >= 0 ? '+' : ''}{diffPercent.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })() : (
                <div className={`text-xs text-center mt-1 ${
                  progressData.isOverTarget ? 'text-green-400' : progressData.percentage < 30 ? 'text-red-400' : progressData.percentage < 70 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {progressData.isOverTarget ? '🎯 目標達成' : progressData.isUnderStop ? '💥 損切ライン超過' : progressData.percentage < 30 ? '⚠️ 危険ゾーン' : progressData.percentage < 70 ? '📊 中間ゾーン' : '🚀 好調ゾーン'}
                </div>
              )}
            </div>

            {/* 損益シミュレーション - 1行凝縮 */}
            {profitLossInfo && positionSummary.totalShares > 0 && (
              <div className="mt-2 pt-2 md:mt-3 md:pt-3 border-t border-gray-700">
                {(() => {
                  const stopLossNum = parseFloat(stopLoss);
                  const targetPriceNum = parseFloat(targetPrice);
                  const hasStopLoss = !!stopLossNum;
                  const hasTarget = !!targetPriceNum;

                  return (
                    <div className="grid grid-cols-2 gap-2 text-xs text-center">
                      <div>
                        <div className="text-gray-400 mb-0.5">損切時</div>
                        {hasStopLoss ? (
                          <div className={profitLossInfo.stopLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                            <span className="font-bold">{!isNaN(profitLossInfo.stopLoss) ? formatProfitLoss(profitLossInfo.stopLoss) : '---'}円</span>
                            {!isNaN(profitLossInfo.stopLossPercent) && <span className="ml-0.5">({profitLossInfo.stopLossPercent >= 0 ? '+' : ''}{profitLossInfo.stopLossPercent.toFixed(1)}%)</span>}
                          </div>
                        ) : (
                          <div className="text-red-400">💡 未設定</div>
                        )}
                      </div>
                      <div>
                        <div className="text-gray-400 mb-0.5">利確時</div>
                        {hasTarget ? (
                          <div className={profitLossInfo.targetProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                            <span className="font-bold">{!isNaN(profitLossInfo.targetProfit) ? formatProfitLoss(profitLossInfo.targetProfit) : '---'}円</span>
                            {!isNaN(profitLossInfo.targetProfitPercent) && <span className="ml-0.5">({profitLossInfo.targetProfitPercent >= 0 ? '+' : ''}{profitLossInfo.targetProfitPercent.toFixed(1)}%)</span>}
                          </div>
                        ) : (
                          <div className="text-green-400">💡 未設定</div>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {/* リスクリワード比 */}
                {riskRewardRatio !== null && (
                  <div className="text-center mt-1">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xs text-gray-400">リスクリワード比</span>
                      <div className={`text-lg font-bold ${
                        riskRewardRatio >= 2
                          ? 'text-green-400'
                          : riskRewardRatio >= 1.5
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {riskRewardRatio.toFixed(2)}
                      </div>
                      <div className={`text-xs font-medium ${
                        riskRewardRatio >= 2
                          ? 'text-green-300'
                          : riskRewardRatio >= 1.5
                          ? 'text-yellow-300'
                          : 'text-red-300'
                      }`}>
                        {riskRewardRatio >= 2
                          ? '🟢 優秀'
                          : riskRewardRatio >= 1.5
                          ? '🟡 適正'
                          : '🔴 リスク高'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 株価推移ミニチャート */}
        <StockMiniChart
          stockId={stockId}
          symbol={symbol}
          targetPrice={parseFloat(targetPrice) || undefined}
          stopLossPrice={parseFloat(stopLoss) || undefined}
        />
      </div>
    </div>
  );
}