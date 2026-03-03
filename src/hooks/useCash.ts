import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useDebouncedCallback } from './useDebounce';

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

export function useCash(): UseCashResult {
  const [cashAmount, setCashAmount] = useState<string>('0');
  const [nextActionMemo, setNextActionMemo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');

  // Supabase認証ユーザーIDを取得
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUser();
  }, []);

  // データ取得
  const fetchCashData = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      setError(null);

      const url = `/api/cash?userId=${userId}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('現金残高の取得に失敗しました');
      }

      const data: CashData = await response.json();
      setCashAmount(data.cashAmount);
      setNextActionMemo(data.nextActionMemo);
    } catch (err) {
      console.error('現金データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');

      // エラー時はlocalStorageにフォールバック
      const fallbackCashAmount = localStorage.getItem('kabunote-cash-amount') || '0';
      const fallbackNextActionMemo = localStorage.getItem('kabunote-next-action-memo') || '';
      setCashAmount(fallbackCashAmount);
      setNextActionMemo(fallbackNextActionMemo);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // userId が確定したらデータ取得
  useEffect(() => {
    fetchCashData();
  }, [fetchCashData]);

  // デバウンスされたAPI保存関数（300ms）
  const debouncedSaveToApi = useDebouncedCallback(async (data: Partial<CashData>) => {
    if (!userId) return;
    try {
      const response = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error('データの更新に失敗しました');
      }

      const result: CashData = await response.json();
      // localStorageにもバックアップ保存
      localStorage.setItem('kabunote-cash-amount', result.cashAmount);
      localStorage.setItem('kabunote-next-action-memo', result.nextActionMemo);
    } catch (err) {
      console.error('データ更新エラー:', err);
      setError(err instanceof Error ? err.message : '更新に失敗しました');

      // エラー時はlocalStorageに直接保存
      if (data.cashAmount !== undefined) {
        localStorage.setItem('kabunote-cash-amount', data.cashAmount);
      }
      if (data.nextActionMemo !== undefined) {
        localStorage.setItem('kabunote-next-action-memo', data.nextActionMemo);
      }
    }
  }, 300);

  // 現金残高のみ更新（即時UI更新 + デバウンスDB保存）
  const updateCash = useCallback((newCashAmount: string) => {
    setCashAmount(newCashAmount);
    debouncedSaveToApi({ cashAmount: newCashAmount });
  }, [debouncedSaveToApi]);

  // Next Actionメモのみ更新（即時UI更新 + デバウンスDB保存）
  const updateNextActionMemo = useCallback((memo: string) => {
    setNextActionMemo(memo);
    debouncedSaveToApi({ nextActionMemo: memo });
  }, [debouncedSaveToApi]);

  // 両方同時更新（即時UI更新 + デバウンスDB保存）
  const updateBoth = useCallback((newCashAmount: string, memo: string) => {
    setCashAmount(newCashAmount);
    setNextActionMemo(memo);
    debouncedSaveToApi({ cashAmount: newCashAmount, nextActionMemo: memo });
  }, [debouncedSaveToApi]);

  return {
    cashAmount,
    nextActionMemo,
    isLoading,
    error,
    updateCash,
    updateNextActionMemo,
    updateBoth,
  };
}
