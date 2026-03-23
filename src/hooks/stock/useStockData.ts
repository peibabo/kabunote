import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from '@/lib/toast';
import { useStockCrud } from '@/hooks/stock/useStockCrud';

// 後方互換: StockData を types/stock.ts から再エクスポート
export type { StockData } from '@/types/stock';
import type { StockData } from '@/types/stock';

export interface PortfolioSnapshotData {
  totalValue: number;
  totalInvestment: number;
  profitLoss: number;
  cashAmount: number;
  netAssets: number;
  snapshotDate: string;
}

interface UseStockDataReturn {
  stockData: StockData[];
  stockDataMap: Map<string, StockData>;
  stockSymbols: string[];
  portfolioSnapshot: PortfolioSnapshotData | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  refreshData: () => Promise<void>;
  /** ローカルステートの並び順を更新（楽観的更新用） */
  reorderStocks: (newSymbolOrder: string[]) => void;
  /** 新規銘柄を追加（楽観的更新 + DB INSERT） */
  addStock: (symbol: string, name?: string, sector?: string, market?: string) => Promise<void>;
  /** 特定銘柄の価格データのみを部分更新（全再取得を避けるため） */
  updateStockPrice: (symbol: string, priceData: { currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }) => void;
  /** 特定銘柄の任意フィールドを部分更新 */
  updateStockData: (symbol: string, updates: Partial<StockData>) => void;
  /** 特定銘柄の特定 eventType のイベントのみ差し替え（null で削除） */
  updateStockEvent: (symbol: string, eventType: string, eventData: StockData['events'][0] | null) => void;
}

export function useStockData(): UseStockDataReturn {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);
  const [portfolioSnapshot, setPortfolioSnapshot] = useState<PortfolioSnapshotData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // addStock ロジックを useStockCrud に委譲
  const { addStock } = useStockCrud({ setStockData, setStockSymbols });

  // データベースからデータを取得
  const loadDataFromDatabase = async (): Promise<void> => {
    try {
      const response = await fetch('/api/stocks/list');

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です');
        }
        const errorData = await response.json();
        throw new Error(errorData.message || 'データの取得に失敗しました');
      }

      const result = await response.json();

      if (result.success) {
        setStockData(result.data);
        setStockSymbols(result.data.map((stock: StockData) => stock.symbol));
        setPortfolioSnapshot(result.portfolioSnapshot ?? null);
      } else {
        throw new Error('APIレスポンスが無効です');
      }
    } catch (err) {
      console.error('❌ データベースからの取得エラー:', err);
      throw err;
    }
  };

  // ローカルステートの並び順を更新（楽観的更新用）
  const reorderStocks = (newSymbolOrder: string[]): void => {
    setStockSymbols(newSymbolOrder);
    setStockData(prev => {
      const ordered = newSymbolOrder
        .map(sym => prev.find(s => s.symbol === sym))
        .filter((s): s is StockData => s !== undefined);
      return ordered;
    });
  };

  // 特定銘柄の価格データのみを部分更新（全再取得を避けるため）
  const updateStockPrice = (
    symbol: string,
    priceData: { currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }
  ): void => {
    setStockData(prev =>
      prev.map(stock =>
        stock.symbol === symbol
          ? { ...stock, ...priceData }
          : stock
      )
    );
  };

  // 特定銘柄の任意フィールドを部分更新
  const updateStockData = (symbol: string, updates: Partial<StockData>): void => {
    setStockData(prev =>
      prev.map(stock => stock.symbol === symbol ? { ...stock, ...updates } : stock)
    );
  };

  // 特定銘柄の特定 eventType のイベントのみ差し替え（null で削除）
  const updateStockEvent = (
    symbol: string,
    eventType: string,
    eventData: StockData['events'][0] | null
  ): void => {
    setStockData(prev =>
      prev.map(stock => {
        if (stock.symbol !== symbol) return stock;
        const filtered = stock.events.filter(e => e.eventType !== eventType);
        const newEvents = eventData ? [...filtered, eventData] : filtered;
        return { ...stock, events: newEvents };
      })
    );
  };

  // データを読み込む
  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await loadDataFromDatabase();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
      toast.error('データの取得に少し手間取っています。再度お試しください');
      console.error('💥 データ取得失敗:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // stockData を symbol → StockData の Map に変換（O(1)検索用）
  const stockDataMap = useMemo(() => {
    const map = new Map<string, StockData>();
    for (const stock of stockData) {
      map.set(stock.symbol, stock);
    }
    return map;
  }, [stockData]);

  // セッション切れ検知
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setStockData([]);
          setStockSymbols([]);
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  // 初回データ取得
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ実行。refreshData は毎レンダーで再生成されるため依存に含めると無限ループ
  }, []);

  return {
    stockData,
    stockDataMap,
    stockSymbols,
    portfolioSnapshot,
    isLoading,
    error,
    isLoggedIn: true, // ミドルウェアで認証必須化済み
    refreshData,
    reorderStocks,
    addStock,
    updateStockPrice,
    updateStockData,
    updateStockEvent,
  };
}
