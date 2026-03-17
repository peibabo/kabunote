import { useState, useCallback } from 'react';
import { getStockData } from '@/data/stockNames';
import { FavoriteGroup } from '@/types/favorites';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

const MAX_STOCKS = 20;

interface UseDashboardActionsProps {
  stockSymbols: string[];
  filteredStocks: string[];
  favoriteGroups: FavoriteGroup[];
  setFavoriteGroups: (groups: FavoriteGroup[]) => void;
  selectedGroupFilter: string | null;
  reorderStocks: (stocks: string[]) => void;
  addStock: (code: string, name?: string, sector?: string, market?: string) => Promise<void>;
}

export function useDashboardActions({
  stockSymbols,
  filteredStocks,
  favoriteGroups,
  setFavoriteGroups,
  selectedGroupFilter,
  reorderStocks,
  addStock,
}: UseDashboardActionsProps) {
  const [additionalError, setAdditionalError] = useState('');
  const [forceOpenAdd, setForceOpenAdd] = useState(false);

  const handleAddStock = async (code: string) => {
    if (stockSymbols.length >= MAX_STOCKS) {
      setAdditionalError(`最大${MAX_STOCKS}銘柄まで登録できます。不要な銘柄を削除してから追加してください。`);
      return;
    }
    if (stockSymbols.includes(code)) {
      setAdditionalError('この銘柄は既に追加されています');
      return;
    }
    setAdditionalError('');

    const stockInfo = await getStockData(code);
    await addStock(code, stockInfo?.name, stockInfo?.sector, stockInfo?.market);

    if (selectedGroupFilter) {
      const updatedGroups = favoriteGroups.map(group => {
        if (group.id === selectedGroupFilter && !group.stocks.includes(code)) {
          return { ...group, stocks: [...group.stocks, code] };
        }
        return group;
      });
      setFavoriteGroups(updatedGroups);
    }
  };

  const handleRemoveStock = useCallback((code: string) => {
    const newStocks = stockSymbols.filter(stock => stock !== code);
    reorderStocks(newStocks);
    setAdditionalError('');

    fetch('/api/stocks', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: code }),
    }).catch(err => console.error('銘柄の削除に失敗:', err));

    const updatedGroups = favoriteGroups.map(group => ({
      ...group,
      stocks: group.stocks.filter(s => s !== code)
    }));
    setFavoriteGroups(updatedGroups);
  }, [stockSymbols, reorderStocks, favoriteGroups, setFavoriteGroups]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = filteredStocks.indexOf(active.id as string);
      const newIndex = filteredStocks.indexOf(over.id as string);
      const newOrder = arrayMove(filteredStocks, oldIndex, newIndex);
      const otherStocks = stockSymbols.filter(stock => !filteredStocks.includes(stock));
      const updatedStocks = [...otherStocks, ...newOrder];

      reorderStocks(updatedStocks);

      fetch('/api/stocks/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: updatedStocks }),
      }).catch(err => console.error('並び順の保存に失敗:', err));
    }
  };

  const handleStockClick = (symbol: string) => {
    const element = document.getElementById(`stock-card-${symbol}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.transform = 'scale(1.02)';
      element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
      setTimeout(() => {
        element.style.transform = '';
        element.style.boxShadow = '';
        element.style.transition = 'all 0.3s ease';
      }, 1000);
    }
  };

  return {
    additionalError,
    setAdditionalError,
    forceOpenAdd,
    setForceOpenAdd,
    handleAddStock,
    handleRemoveStock,
    handleDragEnd,
    handleStockClick,
    MAX_STOCKS,
  };
}
