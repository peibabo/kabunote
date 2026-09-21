import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { toast } from '@/lib/toast';
import { apiFetch } from '@/lib/apiClient';
import { useAppEvent } from '@/hooks/util/useAppEvent';
import { clearSharedFetchCache } from '@/hooks/util/useSharedFetch';
import { APP_EVENTS } from '@/lib/appEvents';
import { useStockCrud } from '@/hooks/stock/useStockCrud';
import type { RealizedTrade } from '@/types/realizedTrade';

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
  const reorderStocks = useCallback((newSymbolOrder: string[]): void => {
    setStockSymbols(newSymbolOrder);
    setStockData(prev => {
      const ordered = newSymbolOrder
        .map(sym => prev.find(s => s.symbol === sym))
        .filter((s): s is StockData => s !== undefined);
      return ordered;
    });
  }, []);

  // 特定銘柄の価格データのみを部分更新（全再取得を避けるため）
  const updateStockPrice = useCallback((
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
  }, []);

  // 特定銘柄の任意フィールドを部分更新
  const updateStockData = useCallback((symbol: string, updates: Partial<StockData>): void => {
    setStockData(prev =>
      prev.map(stock => stock.symbol === symbol ? { ...stock, ...updates } : stock)
    );
  }, []);

  // 特定銘柄の特定 eventType のイベントのみ差し替え（null で削除）
  const updateStockEvent = useCallback((
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
  }, []);

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

  // 確定損益の一括キャッシュ同期。
  //
  // 銘柄カードは `StockData.realizedTrades` を initialData として受け取り初回フェッチを省くため、
  // 売却・削除後にここを更新しないと、タブ切り替えでカードが再マウントした際に
  // ページ読み込み時点の古い履歴が復活してしまう。
  // 他イベント（positions / tags / price 等）は detail に新データが乗るため `useCalendarData` 側で
  // 同期しているが、DB_REALIZED_UPDATE は一覧を持たないため当該銘柄のみ再取得する
  // （1銘柄ぶんの1リクエストであり、カード数に比例しない）。
  useAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, (detail) => {
    // detail.stockId は `stock-{symbol}` 形式（銘柄カード由来）と
    // DBのcuid（ポートフォリオ画面由来）の両方があるため、symbol に正規化する
    const symbol = detail?.symbol
      ?? (detail?.stockId
        ? (detail.stockId.startsWith('stock-')
          ? detail.stockId.slice('stock-'.length)
          : stockData.find(s => s.id === detail.stockId)?.symbol)
        : undefined);
    if (!symbol) return;

    apiFetch<RealizedTrade[]>(`/api/stocks/stock-${symbol}/position/sell`)
      .then(trades => updateStockData(symbol, { realizedTrades: trades }))
      // 同期失敗時はカードのフック側が自前で再取得しているため、キャッシュ更新の失敗は無視する
      .catch(() => {});
  });

  // セッション切れ検知
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setStockData([]);
          setStockSymbols([]);
          // 同一タブで別ユーザーがログインした際に前のユーザーのデータが残らないよう、
          // モジュールスコープの共有フェッチキャッシュも破棄する
          clearSharedFetchCache();
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
