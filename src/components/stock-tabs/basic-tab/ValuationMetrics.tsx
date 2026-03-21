'use client';

import { evaluatePer, evaluatePbr } from '@/lib/positionCalc';

interface ValuationMetricsProps {
  symbol: string;
  per: string;
  pbr: string;
  onPerChange: (value: string) => void;
  onPbrChange: (value: string) => void;
  onChangeSound: () => void;
}

export default function ValuationMetrics({
  symbol,
  per,
  pbr,
  onPerChange,
  onPbrChange,
  onChangeSound,
}: ValuationMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* PER */}
      <div className="space-y-1">
        <label htmlFor={`per-${symbol}`} className="text-xs font-medium text-purple-300">
          📊 PER（株価収益率）
        </label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`per-${symbol}`}
              type="number"
              step="0.1"
              value={per}
              onChange={(e) => { onPerChange(e.target.value); onChangeSound(); }}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-base md:text-sm pr-8"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
          </div>
          {per && parseFloat(per) > 0 && (() => {
            const evaluation = evaluatePer(parseFloat(per));
            return (
              <span className={`text-xs font-medium whitespace-nowrap ${evaluation.color}`}>
                {evaluation.label}
              </span>
            );
          })()}
        </div>
      </div>

      {/* PBR */}
      <div className="space-y-1">
        <label htmlFor={`pbr-${symbol}`} className="text-xs font-medium text-purple-300">
          📊 PBR（株価純資産倍率）
        </label>
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id={`pbr-${symbol}`}
              type="number"
              step="0.01"
              value={pbr}
              onChange={(e) => { onPbrChange(e.target.value); onChangeSound(); }}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-base md:text-sm pr-8"
            />
            <span className="absolute right-3 top-2 text-xs text-gray-400">倍</span>
          </div>
          {pbr && parseFloat(pbr) > 0 && (() => {
            const evaluation = evaluatePbr(parseFloat(pbr));
            return (
              <span className={`text-xs font-medium whitespace-nowrap ${evaluation.color}`}>
                {evaluation.label}
              </span>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
