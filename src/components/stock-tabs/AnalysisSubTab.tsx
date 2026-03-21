'use client';

import { PositionSummary, ProfitLossInfo } from '@/types/positions';
import { useSoundOnChange } from '@/hooks/auth/useSoundOnChange';
import StockMiniChart from '@/components/stock/StockMiniChart';
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
  profitLossInfo
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
        />
      </div>
    </div>
  );
}
