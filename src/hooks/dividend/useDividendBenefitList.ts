import { useState, useMemo, useEffect } from 'react';
import { getStockData } from '@/data/stockNames';
import {
  processDividendBenefitData,
  filterDividendBenefitData,
  sortDividendBenefitData,
  calculateDividendBenefitSummary,
  type StockDataInput,
  type SortKey,
  type FilterType,
} from '@/lib/dividendBenefitCalc';

// 後方互換: 型と純粋関数を再エクスポート
export type { DividendBenefitItem, DividendBenefitSummary, SortKey, FilterType } from '@/lib/dividendBenefitCalc';
export { calculateDaysUntil, getDaysUntilDisplay } from '@/lib/dividendBenefitCalc';

export function useDividendBenefitList(stockSymbols: string[], stockData: StockDataInput) {
  const [sortBy, setSortBy] = useState<SortKey>('dividendYield');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyNames, setCompanyNames] = useState<{ [symbol: string]: string }>({});

  // 会社名を非同期で取得
  useEffect(() => {
    const fetchCompanyNames = async () => {
      const names: { [symbol: string]: string } = {};
      await Promise.all(
        stockSymbols.map(async (symbol) => {
          try {
            const stockInfo = await getStockData(symbol);
            names[symbol] = stockInfo?.name || symbol;
          } catch (error) {
            console.error(`Failed to fetch name for ${symbol}:`, error);
            names[symbol] = symbol;
          }
        })
      );
      setCompanyNames(names);
    };

    fetchCompanyNames();
  }, [stockSymbols]);

  // データ処理
  const processedData = useMemo(
    () => processDividendBenefitData(stockSymbols, stockData, companyNames),
    [stockSymbols, stockData, companyNames]
  );

  // フィルター処理
  const filteredData = useMemo(
    () => filterDividendBenefitData(processedData, filterType, searchQuery),
    [processedData, filterType, searchQuery]
  );

  // ソート処理
  const sortedData = useMemo(
    () => sortDividendBenefitData(filteredData, sortBy, sortOrder),
    [filteredData, sortBy, sortOrder]
  );

  // サマリー統計
  const summary = useMemo(
    () => calculateDividendBenefitSummary(processedData),
    [processedData]
  );

  // ソート変更ハンドラー
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  return {
    sortBy,
    sortOrder,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    sortedData,
    summary,
    handleSort,
  };
}
