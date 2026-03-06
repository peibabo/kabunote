import { useState, useEffect, useMemo } from 'react';
import { loadStockData, getStockData } from '@/data/stockNames';
import { StockData } from '@/hooks/useStockData';
import { FavoriteGroup } from '@/types/favorites';

interface UseStockSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
  filteredStocks: string[];
}

export function useStockSearch(
  stocks: string[],
  stockData: StockData[],
  selectedGroupFilter: string | null,
  favoriteGroups: FavoriteGroup[]
): UseStockSearchReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchStocks = async (targetStocks: string[], query: string): Promise<string[]> => {
    if (!query || query.length < 2) return targetStocks;

    const normalizedQuery = query
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
      )
      .replace(/[\u30A1-\u30F6]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0x60)
      )
      .toLowerCase();

    const searchTerms = normalizedQuery.split(' ').filter(term => term.length > 0);

    await loadStockData();

    const results: string[] = [];

    for (const stockCode of targetStocks) {
      const stockInfo = await getStockData(stockCode);
      const dbStock = stockData.find(s => s.symbol === stockCode);

      const searchData = {
        code: stockCode,
        name: stockInfo?.name || '',
        sector: stockInfo?.sector || '',
        market: stockInfo?.market || '',
        memo: dbStock?.memo || '',
        tags: dbStock && dbStock.tags.length > 0
          ? dbStock.tags.map(tag => tag.label).join(' ')
          : '',
        groups: favoriteGroups
          .filter(group => group.stocks.includes(stockCode))
          .map(group => group.name)
          .join(' ')
      };

      const searchText = [
        searchData.code,
        searchData.name,
        searchData.sector,
        searchData.market,
        searchData.memo,
        searchData.tags,
        searchData.groups
      ].join(' ')
        .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) =>
          String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
        )
        .replace(/[\u30A1-\u30F6]/g, (char) =>
          String.fromCharCode(char.charCodeAt(0) - 0x60)
        )
        .toLowerCase();

      if (searchTerms.every(term => searchText.includes(term))) {
        results.push(stockCode);
      }
    }

    return results;
  };

  // 検索処理のuseEffect（300ms デバウンス）
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const baseStocks = selectedGroupFilter
          ? stocks.filter(stock => {
              const group = favoriteGroups.find(g => g.id === selectedGroupFilter);
              return group?.stocks.includes(stock);
            })
          : stocks;

        const results = await searchStocks(baseStocks, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, stocks, selectedGroupFilter, favoriteGroups, stockData]);

  const filteredStocks = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    if (selectedGroupFilter) {
      return stocks.filter(stock => {
        const group = favoriteGroups.find(g => g.id === selectedGroupFilter);
        return group?.stocks.includes(stock);
      });
    }
    return stocks;
  }, [searchQuery, searchResults, selectedGroupFilter, stocks, favoriteGroups]);

  return { searchQuery, setSearchQuery, isSearching, filteredStocks };
}
