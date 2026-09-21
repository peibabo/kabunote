import { toast } from '@/lib/toast';
import { grantXp } from '@/lib/gamification';
import { StockData } from '@/types/stock';

interface UseStockCrudParams {
  setStockData: React.Dispatch<React.SetStateAction<StockData[]>>;
  setStockSymbols: React.Dispatch<React.SetStateAction<string[]>>;
}

export function useStockCrud({ setStockData, setStockSymbols }: UseStockCrudParams) {
  /** 新規銘柄を追加（楽観的更新 + DB INSERT） */
  const addStock = async (symbol: string, name?: string, sector?: string, market?: string): Promise<void> => {
    // 楽観的更新：まずローカルステートに追加
    const tempId = `stock-${symbol}`;
    setStockData(prev => {
      if (prev.some(s => s.symbol === symbol)) return prev;
      const tempEntry: StockData = {
        id: tempId,
        symbol,
        name: name || symbol,
        sector: sector || null,
        market: market || null,
        order: prev.length,
        currentPrice: null,
        targetPrice: null,
        stopLossPrice: null,
        per: null,
        pbr: null,
        fairPer: null,
        fairPbr: null,
        memo: '',
        positions: [],
        realizedTrades: [],
        events: [],
        dividend: null,
        benefit: null,
        tags: [],
        nextActionPlan: null,
        snapshotPrice: null,
        snapshotValue: null,
        snapshotCost: null,
        snapshotDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [...prev, tempEntry];
    });
    setStockSymbols(prev => {
      if (prev.includes(symbol)) return prev;
      return [...prev, symbol];
    });

    // バックグラウンドでDB INSERT
    try {
      const response = await fetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, name, sector, market }),
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error('❌ POST /api/stocks レスポンス:', response.status, errorBody);
        throw new Error(errorBody.message || '銘柄の保存に失敗しました');
      }
      const result = await response.json();
      // DB UUIDでローカルステートのIDを差し替え
      if (result.success && result.data?.id) {
        setStockData(prev =>
          prev.map(s => s.id === tempId ? { ...s, id: result.data.id } : s)
        );
      }
      grantXp('STOCK_ADD')
    } catch (err) {
      console.error('❌ 銘柄のDB保存に失敗:', err);
      // ロールバック
      setStockData(prev => prev.filter(s => s.id !== tempId));
      setStockSymbols(prev => prev.filter(s => s !== symbol));
      toast.error('銘柄の追加がうまくいきませんでした。再度お試しください');
    }
  };

  return { addStock };
}
