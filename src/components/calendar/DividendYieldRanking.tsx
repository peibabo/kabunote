'use client';

import { useMemo } from 'react';
import { useAccordionState } from '@/hooks/util/useAccordionState';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { calculateDividendInfo, formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { STORAGE_KEYS } from '@/lib/storageKeys';

interface DividendYieldRankingProps {
  dividendBenefitData: Record<string, DividendBenefitStockData>;
  onStockClick: (symbol: string) => void;
}

interface RankedStock {
  symbol: string;
  name: string;
  dividendYield: number;
  dividendPerShare: number;
  annualDividend: number;
  afterTaxAmount: number;
}

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];

export default function DividendYieldRanking({ dividendBenefitData, onStockClick }: DividendYieldRankingProps) {
  const { isExpanded, toggle } = useAccordionState({
    storageKey: STORAGE_KEYS.DIVIDEND_RANKING_EXPANDED,
    defaultExpanded: false,
  });

  const { ranking, avgYield, dividendStockCount, totalStockCount } = useMemo(() => {
    const items: RankedStock[] = [];
    let totalStocks = 0;

    for (const [symbol, data] of Object.entries(dividendBenefitData)) {
      totalStocks++;
      if (!data.dividendInfo?.dividendPerShare || !data.position) continue;

      const dividendPerShare = parseFloat(data.dividendInfo.dividendPerShare);
      if (dividendPerShare <= 0) continue;

      const frequency = data.dividendInfo.dividendFrequency || 1;
      const totalShares = data.position.totalShares;
      const averagePrice = data.position.averagePrice;
      if (averagePrice <= 0) continue;

      const calc = calculateDividendInfo(dividendPerShare, frequency, totalShares, averagePrice);

      items.push({
        symbol,
        name: data.name,
        dividendYield: calc.dividendYield,
        dividendPerShare: dividendPerShare * frequency,
        annualDividend: calc.annualDividend,
        afterTaxAmount: calc.afterTaxAmount,
      });
    }

    items.sort((a, b) => b.dividendYield - a.dividendYield);

    const avg = items.length > 0
      ? items.reduce((sum, i) => sum + i.dividendYield, 0) / items.length
      : 0;

    return { ranking: items, avgYield: avg, dividendStockCount: items.length, totalStockCount: totalStocks };
  }, [dividendBenefitData]);

  if (dividendStockCount === 0) return null;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-4 animate-fade-in">
      <button
        onClick={toggle}
        className="cursor-pointer w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🏆</span>
          <h3 className="text-base font-semibold text-white">配当利回りランキング</h3>
          <span className="text-xs text-gray-400">({dividendStockCount}/{totalStockCount}銘柄)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-gray-400">平均利回り </span>
            <span className="text-sm font-bold text-green-400">{formatDividendYield(avgYield)}%</span>
          </div>
          <span className="text-gray-400 text-sm">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-1">
          {ranking.map((stock, index) => (
            <button
              key={stock.symbol}
              onClick={() => onStockClick(stock.symbol)}
              className="cursor-pointer w-full text-left flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-gray-700/30 transition-colors"
            >
              <span className="text-sm w-6 text-center shrink-0">
                {index < 3 ? MEDAL_ICONS[index] : <span className="text-xs text-gray-500">{index + 1}位</span>}
              </span>
              <span className="text-sm text-gray-200 truncate flex-1 min-w-0">
                {stock.name}({stock.symbol})
              </span>
              <span className={`text-sm font-bold shrink-0 ${
                stock.dividendYield >= 4 ? 'text-green-400' :
                stock.dividendYield >= 2 ? 'text-blue-400' : 'text-gray-300'
              }`}>
                {formatDividendYield(stock.dividendYield)}%
              </span>
              <span className="text-xs text-gray-500 w-20 text-right shrink-0">
                ¥{formatDividendAmount(stock.dividendPerShare)}/株
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
