'use client';

import { useMemo } from 'react';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { calculateDividendInfo, formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';

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

export function useDividendRanking(dividendBenefitData: Record<string, DividendBenefitStockData>) {
  return useMemo(() => {
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
      const taxRate = data.position.weightedTaxRate ?? 0.20315;
      const calc = calculateDividendInfo(dividendPerShare, frequency, totalShares, averagePrice, taxRate);
      items.push({
        symbol, name: data.name,
        dividendYield: calc.dividendYield, dividendPerShare: dividendPerShare * frequency,
        annualDividend: calc.annualDividend, afterTaxAmount: calc.afterTaxAmount,
      });
    }

    items.sort((a, b) => b.dividendYield - a.dividendYield);
    const avg = items.length > 0 ? items.reduce((sum, i) => sum + i.dividendYield, 0) / items.length : 0;
    return { ranking: items, avgYield: avg, dividendStockCount: items.length, totalStockCount: totalStocks };
  }, [dividendBenefitData]);
}

export default function DividendYieldRanking({ dividendBenefitData, onStockClick }: DividendYieldRankingProps) {
  const { ranking, avgYield, dividendStockCount, totalStockCount } = useDividendRanking(dividendBenefitData);

  if (dividendStockCount === 0) {
    return <div className="text-sm text-gray-500 text-center py-4">配当利回りデータがありません</div>;
  }

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-2">
        <span>平均利回り: <span className="text-green-400 font-bold">{formatDividendYield(avgYield)}%</span></span>
        <span>{dividendStockCount}/{totalStockCount}銘柄</span>
      </div>

      <div className="space-y-1">
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
    </div>
  );
}
