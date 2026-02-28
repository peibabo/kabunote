import { useState, useEffect, useCallback } from 'react';

interface CashData {
  cashAmount: string;
  nextActionMemo: string;
}

interface UseCashResult {
  cashAmount: string;
  nextActionMemo: string;
  isLoading: boolean;
  error: string | null;
  updateCash: (cashAmount: string) => Promise<void>;
  updateNextActionMemo: (memo: string) => Promise<void>;
  updateBoth: (cashAmount: string, memo: string) => Promise<void>;
}

const DEFAULT_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
console.log('🔑 useCash - 使用中のユーザーID:', DEFAULT_USER_ID); // テスト用UUID（実際のアプリではAuthから取得）

export function useCash(): UseCashResult {
  const [cashAmount, setCashAmount] = useState<string>('0');
  const [nextActionMemo, setNextActionMemo] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // データ取得
  const fetchCashData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const url = `/api/cash?userId=${DEFAULT_USER_ID}`;
      console.log('📡 useCash - リクエストURL:', url);
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
  }, []);

  // データ更新（共通処理）
  const updateData = useCallback(async (updateData: Partial<CashData>) => {
    try {
      setError(null);

      const response = await fetch('/api/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: DEFAULT_USER_ID,
          ...updateData,
        }),
      });

      if (!response.ok) {
        throw new Error('データの更新に失敗しました');
      }

      const data: CashData = await response.json();
      setCashAmount(data.cashAmount);
      setNextActionMemo(data.nextActionMemo);

      // localStorageにも保存（バックアップ）
      localStorage.setItem('kabunote-cash-amount', data.cashAmount);
      localStorage.setItem('kabunote-next-action-memo', data.nextActionMemo);
    } catch (err) {
      console.error('データ更新エラー:', err);
      setError(err instanceof Error ? err.message : '更新に失敗しました');

      // エラー時はlocalStorageに直接保存
      if (updateData.cashAmount !== undefined) {
        localStorage.setItem('kabunote-cash-amount', updateData.cashAmount);
        setCashAmount(updateData.cashAmount);
      }
      if (updateData.nextActionMemo !== undefined) {
        localStorage.setItem('kabunote-next-action-memo', updateData.nextActionMemo);
        setNextActionMemo(updateData.nextActionMemo);
      }
    }
  }, []);

  // 現金残高のみ更新
  const updateCash = useCallback(async (newCashAmount: string) => {
    await updateData({ cashAmount: newCashAmount });
  }, [updateData]);

  // Next Actionメモのみ更新
  const updateNextActionMemo = useCallback(async (memo: string) => {
    await updateData({ nextActionMemo: memo });
  }, [updateData]);

  // 両方同時更新
  const updateBoth = useCallback(async (newCashAmount: string, memo: string) => {
    await updateData({
      cashAmount: newCashAmount,
      nextActionMemo: memo
    });
  }, [updateData]);

  // 初期データ取得
  useEffect(() => {
    fetchCashData();
  }, [fetchCashData]);

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