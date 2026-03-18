'use client';

import { useState } from 'react';
import { useAccordionState } from '@/hooks/util/useAccordionState';
import { useMonthlyDividendData, MonthlyDividendEntry } from '@/hooks/dividend/useMonthlyDividendData';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { formatDividendAmount } from '@/lib/dividendCalc';
import { STORAGE_KEYS } from '@/lib/storageKeys';

interface MonthlyDividendChartProps {
  dividendBenefitData: Record<string, DividendBenefitStockData>;
}

function MonthBar({ entry, maxAmount, onToggle, isOpen }: {
  entry: MonthlyDividendEntry;
  maxAmount: number;
  onToggle: () => void;
  isOpen: boolean;
}) {
  const widthPercent = maxAmount > 0 ? (entry.grossAmount / maxAmount) * 100 : 0;
  const hasStocks = entry.stocks.length > 0;

  return (
    <div>
      <button
        onClick={hasStocks ? onToggle : undefined}
        className={`cursor-pointer w-full flex items-center gap-2 py-1.5 group ${hasStocks ? 'hover:bg-gray-700/30' : ''} rounded transition-colors`}
      >
        <span className="text-xs text-gray-400 w-8 text-right shrink-0">{entry.label}</span>
        <div className="flex-1 h-5 bg-gray-700/30 rounded-full overflow-hidden">
          {widthPercent > 0 && (
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(widthPercent, 2)}%`,
                background: 'linear-gradient(90deg, rgb(34, 197, 94), rgb(22, 163, 74))',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.3)',
              }}
            />
          )}
        </div>
        <span className={`text-xs w-20 text-right shrink-0 ${hasStocks ? 'text-green-400' : 'text-gray-600'}`}>
          {hasStocks ? `¥${formatDividendAmount(entry.afterTaxAmount)}` : '-'}
        </span>
        {hasStocks && (
          <span className="text-xs text-gray-500 w-4 shrink-0">
            {isOpen ? '▼' : '▶'}
          </span>
        )}
      </button>

      {isOpen && hasStocks && (
        <div className="ml-10 mb-1 space-y-0.5">
          {entry.stocks.map((stock) => (
            <div key={stock.symbol} className="flex items-center gap-2 text-xs text-gray-400 py-0.5">
              <span className="text-green-500">•</span>
              <span className="truncate flex-1">{stock.name}({stock.symbol})</span>
              <span className="text-gray-500">¥{formatDividendAmount(stock.afterTaxAmount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MonthlyDividendChart({ dividendBenefitData }: MonthlyDividendChartProps) {
  const { isExpanded, toggle } = useAccordionState({
    storageKey: STORAGE_KEYS.MONTHLY_DIVIDEND_EXPANDED,
    defaultExpanded: false,
  });
  const [openMonth, setOpenMonth] = useState<number | null>(null);

  const summary = useMonthlyDividendData(dividendBenefitData);

  if (summary.stockCount === 0) return null;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-4 animate-fade-in">
      <button
        onClick={toggle}
        className="cursor-pointer w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💰</span>
          <h3 className="text-base font-semibold text-white">月別配当カレンダー</h3>
          <span className="text-xs text-gray-400">({summary.stockCount}銘柄)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-gray-400">年間(税引後) </span>
            <span className="text-sm font-bold text-green-400">¥{formatDividendAmount(summary.yearlyAfterTax)}</span>
          </div>
          <span className="text-gray-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-0.5">
          {summary.months.map((entry) => (
            <MonthBar
              key={entry.month}
              entry={entry}
              maxAmount={summary.maxMonthlyAmount}
              isOpen={openMonth === entry.month}
              onToggle={() => setOpenMonth(openMonth === entry.month ? null : entry.month)}
            />
          ))}

          <div className="border-t border-gray-700/50 mt-2 pt-2 flex justify-between text-xs">
            <span className="text-gray-400">年間合計(税引前)</span>
            <span className="text-gray-300">¥{formatDividendAmount(summary.yearlyGross)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
