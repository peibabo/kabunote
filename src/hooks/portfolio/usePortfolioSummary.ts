import { useMemo } from 'react';
import { Position } from '@/types/positions';
import { CustomTag } from '@/types/tags';
import { getCompanyNameSync, getSectorSync } from '@/data/stockNames';
import { calculateOverallSummary, type PortfolioStockData } from '@/lib/portfolioSummaryCalc';

// 後方互換: 型を再エクスポート
export type { OverallSummary, PortfolioStockData } from '@/lib/portfolioSummaryCalc';

// usePortfolioSummary の入力型（PortfolioStockData と同一）
export type StockData = PortfolioStockData;

export interface ChartPortfolioItem {
  symbol: string;
  name: string;
  positions: Position[];
  currentPrice: number | null;
  sector: string | null;
  customTags: CustomTag[];
  dividend: { dividendPerShare: number; frequency: number | null } | null;
  benefit: { minimumShares: number; estimatedValue: number | null } | null;
}

export function usePortfolioSummary(portfolioData: StockData[], cashAmount: string) {
  const overallSummary = useMemo(
    () => calculateOverallSummary(portfolioData, cashAmount),
    [portfolioData, cashAmount]
  );

  // InvestmentPieChart用データを構築
  const chartPortfolioData = useMemo<ChartPortfolioItem[]>(() => {
    return portfolioData.map(stock => {
      const dividend = stock.dividend?.dividendPerShare
        ? { dividendPerShare: stock.dividend.dividendPerShare, frequency: stock.dividend.frequency }
        : null;

      const benefit = stock.benefit?.minimumShares
        ? { minimumShares: stock.benefit.minimumShares, estimatedValue: stock.benefit.estimatedValue }
        : null;

      const csvName = getCompanyNameSync(stock.symbol);
      const resolvedName = (stock.name && stock.name !== stock.symbol)
        ? stock.name
        : (csvName !== '読み込み中...' && csvName !== '銘柄情報なし' ? csvName : stock.symbol);

      return {
        symbol: stock.symbol,
        name: resolvedName,
        positions: stock.positions || [],
        currentPrice: stock.currentPrice,
        sector: stock.sector || getSectorSync(stock.symbol),
        customTags: (stock.tags || []).map(tag => ({
          id: tag.id,
          label: tag.label,
          color: tag.color as CustomTag['color'],
          createdAt: tag.createdAt,
        })),
        dividend,
        benefit,
      };
    });
  }, [portfolioData]);

  return { overallSummary, chartPortfolioData };
}
