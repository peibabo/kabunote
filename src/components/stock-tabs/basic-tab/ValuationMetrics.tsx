'use client';

import { evaluatePer, evaluatePbr, calculateTheoreticalPriceByPer, calculateTheoreticalPriceByPbr } from '@/lib/positionCalc';

interface ValuationMetricsProps {
  symbol: string;
  per: string;
  pbr: string;
  fairPer: string;
  fairPbr: string;
  currentPrice: string;
  onPerChange: (value: string) => void;
  onPbrChange: (value: string) => void;
  onFairPerChange: (value: string) => void;
  onFairPbrChange: (value: string) => void;
  onChangeSound: () => void;
}

function formatDeviation(percent: number): string {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

function formatPrice(price: number): string {
  return price.toLocaleString('ja-JP', { maximumFractionDigits: 0 });
}

export default function ValuationMetrics({
  symbol,
  per,
  pbr,
  fairPer,
  fairPbr,
  currentPrice,
  onPerChange,
  onPbrChange,
  onFairPerChange,
  onFairPbrChange,
  onChangeSound,
}: ValuationMetricsProps) {
  const perNum = per ? parseFloat(per) : null;
  const pbrNum = pbr ? parseFloat(pbr) : null;
  const fairPerNum = fairPer ? parseFloat(fairPer) : null;
  const fairPbrNum = fairPbr ? parseFloat(fairPbr) : null;
  const priceNum = currentPrice ? parseFloat(currentPrice) : null;

  const perEval = perNum && perNum > 0 ? evaluatePer(perNum, fairPerNum) : null;
  const pbrEval = pbrNum && pbrNum > 0 ? evaluatePbr(pbrNum, fairPbrNum) : null;

  // 理論株価（PER/PBRベース）
  const theoreticalPricePer = priceNum && perNum && perNum > 0 && fairPerNum && fairPerNum > 0
    ? calculateTheoreticalPriceByPer(priceNum, perNum, fairPerNum)
    : null;
  const theoreticalPricePbr = priceNum && pbrNum && pbrNum > 0 && fairPbrNum && fairPbrNum > 0
    ? calculateTheoreticalPriceByPbr(priceNum, pbrNum, fairPbrNum)
    : null;

  const inputClassName = "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-base md:text-sm pr-8";

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* PER */}
      <div className="space-y-1.5">
        <label htmlFor={`per-${symbol}`} className="text-xs font-medium text-purple-300">
          PER（株価収益率）
        </label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`per-${symbol}`}
              type="number"
              step="0.1"
              value={per}
              onChange={(e) => { onPerChange(e.target.value); onChangeSound(); }}
              placeholder="現在"
              className={inputClassName}
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
          </div>
          {perEval && (
            <span className={`text-xs font-medium whitespace-nowrap ${perEval.color}`}>
              {perEval.label}
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`fair-per-${symbol}`}
              type="number"
              step="0.1"
              value={fairPer}
              onChange={(e) => { onFairPerChange(e.target.value); onChangeSound(); }}
              placeholder="例: 15"
              className={inputClassName}
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
          </div>
          {fairPer ? (
            <span className="text-xs text-gray-500 whitespace-nowrap">適正</span>
          ) : (
            <button
              type="button"
              onClick={() => { onFairPerChange('15'); onChangeSound(); }}
              className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              目安15倍
            </button>
          )}
        </div>
        {perEval?.hasFairValue && perEval.deviationPercent != null ? (
          <div className="text-xs space-y-0.5 pl-1">
            <div className={perEval.color}>
              適正{fairPer}倍比で {formatDeviation(perEval.deviationPercent)}
            </div>
            {theoreticalPricePer != null && (
              <div className="text-gray-400">
                理論株価: <span className="text-white font-medium">{formatPrice(theoreticalPricePer)}円</span>
              </div>
            )}
          </div>
        ) : !fairPer && (
          <p className="text-xs text-gray-500 pl-1">日本市場平均: 約15倍（業種により異なります）</p>
        )}
      </div>

      {/* PBR */}
      <div className="space-y-1.5">
        <label htmlFor={`pbr-${symbol}`} className="text-xs font-medium text-purple-300">
          PBR（株価純資産倍率）
        </label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`pbr-${symbol}`}
              type="number"
              step="0.01"
              value={pbr}
              onChange={(e) => { onPbrChange(e.target.value); onChangeSound(); }}
              placeholder="現在"
              className={inputClassName}
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
          </div>
          {pbrEval && (
            <span className={`text-xs font-medium whitespace-nowrap ${pbrEval.color}`}>
              {pbrEval.label}
            </span>
          )}
        </div>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`fair-pbr-${symbol}`}
              type="number"
              step="0.01"
              value={fairPbr}
              onChange={(e) => { onFairPbrChange(e.target.value); onChangeSound(); }}
              placeholder="例: 1.0"
              className={inputClassName}
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
          </div>
          {fairPbr ? (
            <span className="text-xs text-gray-500 whitespace-nowrap">適正</span>
          ) : (
            <button
              type="button"
              onClick={() => { onFairPbrChange('1'); onChangeSound(); }}
              className="text-xs text-purple-400 hover:text-purple-300 whitespace-nowrap cursor-pointer transition-colors"
            >
              目安1.0倍
            </button>
          )}
        </div>
        {pbrEval?.hasFairValue && pbrEval.deviationPercent != null ? (
          <div className="text-xs space-y-0.5 pl-1">
            <div className={pbrEval.color}>
              適正{fairPbr}倍比で {formatDeviation(pbrEval.deviationPercent)}
            </div>
            {theoreticalPricePbr != null && (
              <div className="text-gray-400">
                理論株価: <span className="text-white font-medium">{formatPrice(theoreticalPricePbr)}円</span>
              </div>
            )}
          </div>
        ) : !fairPbr && (
          <p className="text-xs text-gray-500 pl-1">1.0倍=解散価値。業種平均を参考に</p>
        )}
      </div>
    </div>
  );
}
