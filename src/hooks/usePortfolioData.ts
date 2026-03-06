import { useMemo } from 'react';
import { StockData } from '@/hooks/useStockData';

interface UsePortfolioDataReturn {
  hasPortfolioData: boolean;
}

export function usePortfolioData(
  stockData: StockData[],
  isInitialized: boolean
): UsePortfolioDataReturn {
  const hasPortfolioData = useMemo(() => {
    if (!isInitialized || stockData.length === 0) return false;
    return stockData.some(stock => stock.positions.length > 0);
  }, [stockData, isInitialized]);

  return { hasPortfolioData };
}
