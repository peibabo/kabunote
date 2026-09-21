'use client';

import { Position, PositionSummary, ProfitLossInfo } from '@/types/positions';
import type { RealizedTrade } from '@/types/realizedTrade';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';
import StockMiniChart from '@/components/stock/StockMiniChart';
import { calcPriceChange, formatPriceChange } from '@/lib/priceChangeCalc';
import { calculateProgress, calculateRiskRewardRatio } from './analysis/analysisCalc';
import PriceProgressBar from './analysis/PriceProgressBar';

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
  snapshotPrice: number | null;
  snapshotDate: string | null;
  snapshotValue: number | null;
  snapshotCost: number | null;
  initialPositions?: Position[];
  initialRealizedTrades?: RealizedTrade[];
}

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
  profitLossInfo,
  snapshotPrice,
  snapshotDate,
  snapshotValue,
  snapshotCost,
  initialPositions,
  initialRealizedTrades,
}: AnalysisSubTabProps) {
  const progressData = calculateProgress(targetPrice, stopLoss, currentPrice);
  const riskRewardRatio = calculateRiskRewardRatio(profitLossInfo);

  const onChangeSound = useSoundOnChange();

  return (
    <div className="space-y-4">
      {/* 投資規律設定 */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 損切ライン */}
          <div className="space-y-1">
            <label htmlFor={`stop-loss-${symbol}`} className="text-xs font-medium text-red-300">
              {'\u{1F53B}'} 損切ライン
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
              {'\u{1F4C8}'} 現在の株価
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
              {'\u{1F4B0}'} 利確目標
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

        {/* 前回比サマリーバー */}
        {(() => {
          const current = parseFloat(currentPrice);
          if (!current || current <= 0) return null;
          const change = calcPriceChange(current, snapshotPrice);
          if (!change || snapshotPrice == null) return null;
          const { diffText, rateText } = formatPriceChange(change);
          const colorClass =
            change.direction === 'up' ? 'text-green-400'
            : change.direction === 'down' ? 'text-red-400'
            : 'text-gray-400';
          const tooltip = snapshotDate ? `前回記録: ${snapshotDate}` : undefined;

          // 損益比較の計算
          const prevPL = (snapshotValue != null && snapshotCost != null) ? snapshotValue - snapshotCost : null;
          const currentPL = positionSummary.totalShares > 0
            ? current * positionSummary.totalShares - positionSummary.totalCost
            : null;
          const showPL = prevPL != null && currentPL != null && positionSummary.totalShares > 0;

          const plData = showPL ? (() => {
            const plDiff = currentPL - prevPL;
            const plDiffColor = plDiff > 0 ? 'text-green-400' : plDiff < 0 ? 'text-red-400' : 'text-gray-400';
            const plSign = (v: number) => v >= 0 ? '+' : '';
            return { plDiff, plDiffColor, plSign, prevPL, currentPL };
          })() : null;

          return (
            <div
              className="bg-gray-700/30 rounded-lg px-3 py-1.5 text-center text-xs"
              title={tooltip}
            >
              <div>
                <span className="text-gray-400">前回 ¥{snapshotPrice.toLocaleString()}</span>
                <span className="text-gray-500 mx-1">→</span>
                <span className="text-gray-300">現在 ¥{current.toLocaleString()}</span>
                <span className={`ml-1.5 font-medium ${colorClass}`}>
                  （{diffText} / {rateText}）
                </span>
              </div>
              {plData && (
                <div className="mt-1">
                  <span className="text-gray-400">損益 ¥{`${plData.plSign(plData.prevPL)}${Math.round(plData.prevPL).toLocaleString()}`}</span>
                  <span className="text-gray-500 mx-1">→</span>
                  <span className="text-gray-300">¥{`${plData.plSign(plData.currentPL)}${Math.round(plData.currentPL).toLocaleString()}`}</span>
                  <span className={`ml-1.5 font-medium ${plData.plDiffColor}`}>
                    （{plData.plSign(plData.plDiff)}¥{Math.abs(Math.round(plData.plDiff)).toLocaleString()}）
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ネオンライト株価プログレスバーゲージ・損益分析統合セクション */}
        {progressData && targetPrice && stopLoss && currentPrice && (
          <PriceProgressBar
            progressData={progressData}
            positionSummary={positionSummary}
            profitLossInfo={profitLossInfo}
            riskRewardRatio={riskRewardRatio}
            targetPrice={targetPrice}
            stopLoss={stopLoss}
            currentPrice={currentPrice}
          />
        )}

        {/* 株価推移ミニチャート */}
        <StockMiniChart
          stockId={stockId}
          symbol={symbol}
          targetPrice={parseFloat(targetPrice) || undefined}
          stopLossPrice={parseFloat(stopLoss) || undefined}
          initialTradeMarkers={
            initialPositions && initialRealizedTrades
              ? { positions: initialPositions, trades: initialRealizedTrades }
              : undefined
          }
        />
      </div>
    </div>
  );
}
