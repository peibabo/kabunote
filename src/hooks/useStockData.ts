import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

interface StockData {
  id: string;
  symbol: string;
  name: string;
  sector: string | null;
  market: string | null;
  order: number;
  currentPrice: number | null;
  targetPrice: number | null;
  stopLossPrice: number | null;
  memo: string;
  positions: Array<{
    id: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
    memo: string;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    eventDate: string | null;
    eventMonth: number | null;
    eventDay: number | null;
    isRecurring: boolean;
    isActive: boolean;
  }>;
  dividend: {
    dividendPerShare: number;
    frequency: number;
    rightsMonth: number;
    rightsDay: number;
  } | null;
  benefit: {
    description: string;
    minimumShares: number;
    estimatedValue: number;
    rightsMonth: number;
    rightsDay: number;
  } | null;
  tags: Array<{
    id: string;
    label: string;
    color: string;
    createdAt: string;
  }>;
  nextActionPlan: {
    actionType: string;
    priority: string;
    targetPrice: number | null;
    targetShares: number | null;
    strategyMemo: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface UseStockDataReturn {
  stockData: StockData[];
  stockSymbols: string[];
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  refreshData: () => Promise<void>;
}

const STORAGE_KEY = 'kabunote-stocks';

export function useStockData(): UseStockDataReturn {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [stockSymbols, setStockSymbols] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // データベースからデータを取得
  const loadDataFromDatabase = async (): Promise<void> => {
    try {
      console.log('🔄 データベースからデータを取得開始...');
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
        console.log(`✅ データベースから${result.count}件の株式データを取得完了`);
      } else {
        throw new Error('APIレスポンスが無効です');
      }
    } catch (err) {
      console.error('❌ データベースからの取得エラー:', err);
      throw err;
    }
  };

  // localStorageからデータを取得（フォールバック）
  const loadDataFromLocalStorage = (): void => {
    console.log('📦 localStorage読み込み開始...');
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('📦 localStorage rawData:', saved ? `${saved.length}文字` : 'null');

      if (saved) {
        try {
          const parsedStocks = JSON.parse(saved);
          console.log('📦 パースされた株式データ:', parsedStocks);
          setStockSymbols(parsedStocks);

          // localStorageの場合は簡易データ形式
          const simpleStockData = parsedStocks.map((symbol: string, index: number) => ({
            id: `stock-${symbol}`,
            symbol,
            name: symbol, // 実際の名前は別途取得が必要
            sector: null,
            market: null,
            order: index,
            currentPrice: null,
            targetPrice: null,
            stopLossPrice: null,
            memo: '',
            positions: (() => {
              try {
                const stored = localStorage.getItem(`kabunote-positions-${symbol}`);
                return stored ? JSON.parse(stored) : [];
              } catch { return []; }
            })(),
            events: [],
            dividend: null,
            benefit: null,
            tags: [],
            nextActionPlan: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));

          setStockData(simpleStockData);
          console.log(`✅ localStorageから${parsedStocks.length}件の銘柄コードを取得完了`);
          console.log('📊 設定されたstockData:', simpleStockData);
        } catch (e) {
          console.error('❌ localStorage読み込みエラー:', e);
          setError('保存されたデータの読み込みに失敗しました');
        }
      } else {
        // 初回時は空配列
        setStockData([]);
        setStockSymbols([]);
        console.log('📦 localStorage: データなし（初回）');
      }
    } else {
      console.log('❌ windowオブジェクトが利用できません');
    }
  };

  // データを読み込む
  const refreshData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    console.log(`🚀 データ読み込み開始 - 認証状態: ${isLoggedIn}`);

    try {
      if (isLoggedIn) {
        console.log('🔐 認証済みユーザー: データベースから取得を試行');
        // 認証済みの場合はデータベースから取得
        await loadDataFromDatabase();
      } else {
        console.log('👤 未認証ユーザー: localStorageから取得');
        // 未認証の場合はlocalStorageから取得
        loadDataFromLocalStorage();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'データの取得に失敗しました';
      setError(errorMessage);
      console.error('💥 完全なデータ取得失敗:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 認証状態が変わった時やマウント時にデータを取得
  useEffect(() => {
    refreshData();
  }, [isLoggedIn]);

  return {
    stockData,
    stockSymbols,
    isLoading,
    error,
    isLoggedIn,
    refreshData
  };
}