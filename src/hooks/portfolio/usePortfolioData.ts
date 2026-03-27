import { useMemo } from 'react';
import { StockData } from '@/hooks/stock/useStockData';

interface UsePortfolioDataReturn {
  hasPortfolioData: boolean;
  hasSnapshotReady: boolean;
}

export function usePortfolioData(
  stockData: StockData[],
  isInitialized: boolean
): UsePortfolioDataReturn {
  const hasPortfolioData = useMemo(() => {
    if (!isInitialized || stockData.length === 0) return false;
    return stockData.some(stock => stock.positions.length > 0);
  }, [stockData, isInitialized]);

  const hasSnapshotReady = useMemo(() => {
    if (!isInitialized || stockData.length === 0) return false;
    return stockData.some(stock =>
      stock.positions.some(p => p.shares > 0) &&
      stock.currentPrice != null && stock.currentPrice > 0
    );
  }, [stockData, isInitialized]);

  return { hasPortfolioData, hasSnapshotReady };
}
