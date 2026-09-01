'use client';

import type { ChartType, ChartMemoMap } from '@/types/portfolio';
import { chartMemoKey } from '@/types/portfolio';
import { formatPrice } from '@/lib/positionCalc';
import { formatRatePercent } from '@/lib/stockRateCalc';

interface CustomTooltipContentProps {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: string;
  memoMap: ChartMemoMap;
  chartType: ChartType;
}

export default function ChartTooltip({
  active,
  payload,
  label,
  memoMap,
  chartType,
}: CustomTooltipContentProps) {
  if (!active || !payload?.length) return null;

  const fullDate = payload[0]?.payload?.fullDate as string | undefined;

  // 値上がり率チャートは騰落率の高い順に表示（データ欠損の系列は末尾）
  const displayPayload = chartType === 'stocks'
    ? [...payload].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
    : payload;

  // メモ収集
  const memoEntries: { label: string; content: string }[] = [];
  if (fullDate) {
    if (chartType === 'stocks') {
      for (const p of displayPayload) {
        const sym = (p.dataKey as string).replace('rate_', '');
        const memo = memoMap.get(chartMemoKey(fullDate, chartType, sym));
        if (memo) memoEntries.push({ label: sym, content: memo.content });
      }
    } else {
      const memo = memoMap.get(chartMemoKey(fullDate, chartType));
      if (memo) memoEntries.push({ label: '', content: memo.content });
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
      <p className="text-xs text-gray-400 mb-2">{label}</p>
      {displayPayload.map((entry: { name: string; value: number; color: string; dataKey?: string; payload?: Record<string, unknown> }, i: number) => {
        if (chartType === 'stocks') {
          // 値上がり率（起点比%）+ 実株価の併記
          const sym = (entry.dataKey as string).replace('rate_', '');
          const price = entry.payload?.[`price_${sym}`];
          const rateColor = entry.value > 0 ? 'text-green-300' : entry.value < 0 ? 'text-red-300' : 'text-white';
          return (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-300 truncate">{entry.name}:</span>
              <span className={`font-medium whitespace-nowrap ${rateColor}`}>
                {formatRatePercent(entry.value)}
                {typeof price === 'number' && (
                  <span className="text-gray-400 font-normal"> ({formatPrice(price)}円)</span>
                )}
              </span>
            </div>
          );
        }
        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white font-medium">
              {entry.value >= 0 ? '' : '-'}{formatPrice(Math.abs(entry.value))}円
            </span>
          </div>
        );
      })}
      {memoEntries.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-600">
          {memoEntries.map((entry, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs">
              <span className="text-yellow-400 mt-0.5">📝</span>
              <span className="text-yellow-200">
                {entry.label && <span className="text-gray-400">{entry.label}: </span>}
                {entry.content.length > 50 ? entry.content.slice(0, 50) + '…' : entry.content}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 pt-1.5 border-t border-gray-700 text-xs text-gray-500">
        📝 クリックでメモを残せます
      </p>
    </div>
  );
}
