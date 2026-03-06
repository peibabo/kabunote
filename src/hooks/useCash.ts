import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from './useDebounce';
import { toast } from '@/lib/toast';

interface CashData {
  cashAmount: string;
  nextActionMemo: string;
}

interface UseCashResult {
  cashAmount: string;
  nextActionMemo: string;
  isLoading: boolean;
  error: string | null;
  updateCash: (cashAmount: string) => void;
  updateNextActionMemo: (memo: string) => void;
  updateBoth: (cashAmount: string, memo: string) => void;
}

// Module-level cache shared across all useCash() instances
let cachedData: CashData | null = null;
let fetchPromise: Promise<CashData | null> | null = null;

const CASH_UPDATE_EVENT = 'kabunote-cash-update';

async function fetchCashOnce(): Promise<CashData | null> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch('/api/cash');
      if (!response.ok) throw new Error('現金残高の取得に失敗しました');
      const data: CashData = await response.json();
      cachedData = data;
      return data;
    } catch {
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useCash(): UseCashResult {
  const [cashAmount, setCashAmount] = useState<string>(cachedData?.cashAmount ?? '0');
  const [nextActionMemo, setNextActionMemo] = useState<string>(cachedData?.nextActionMemo ?? '');
  const [isLoading, setIsLoading] = useState<boolean>(cachedData === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedData) {
      setCashAmount(cachedData.cashAmount);
      setNextActionMemo(cachedData.nextActionMemo);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchCashOnce().then(data => {
      if (cancelled) return;
      if (data) {
        setCashAmount(data.cashAmount);
        setNextActionMemo(data.nextActionMemo);
      } else {
        setError('現金残高の取得に失敗しました');
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Listen for updates from other instances
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<CashData>).detail;
      setCashAmount(detail.cashAmount);
      setNextActionMemo(detail.nextActionMemo);
    };
    window.addEventListener(CASH_UPDATE_EVENT, handler);
    return () => window.removeEventListener(CASH_UPDATE_EVENT, handler);
  }, []);

  const debouncedSaveToApi = useDebouncedCallback(async (data: Partial<CashData>) => {
    try {
      const response = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('データの更新に失敗しました');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '更新に失敗しました';
      console.error('データ更新エラー:', err);
      setError(msg);
      toast.error(msg);
    }
  }, 300);

  const broadcastUpdate = useCallback((newCash: string, newMemo: string) => {
    cachedData = { cashAmount: newCash, nextActionMemo: newMemo };
    window.dispatchEvent(new CustomEvent(CASH_UPDATE_EVENT, { detail: cachedData }));
  }, []);

  const updateCash = useCallback((newCashAmount: string) => {
    setCashAmount(newCashAmount);
    broadcastUpdate(newCashAmount, nextActionMemo);
    debouncedSaveToApi({ cashAmount: newCashAmount });
  }, [debouncedSaveToApi, broadcastUpdate, nextActionMemo]);

  const updateNextActionMemo = useCallback((memo: string) => {
    setNextActionMemo(memo);
    broadcastUpdate(cashAmount, memo);
    debouncedSaveToApi({ nextActionMemo: memo });
  }, [debouncedSaveToApi, broadcastUpdate, cashAmount]);

  const updateBoth = useCallback((newCashAmount: string, memo: string) => {
    setCashAmount(newCashAmount);
    setNextActionMemo(memo);
    broadcastUpdate(newCashAmount, memo);
    debouncedSaveToApi({ cashAmount: newCashAmount, nextActionMemo: memo });
  }, [debouncedSaveToApi, broadcastUpdate]);

  return { cashAmount, nextActionMemo, isLoading, error, updateCash, updateNextActionMemo, updateBoth };
}
