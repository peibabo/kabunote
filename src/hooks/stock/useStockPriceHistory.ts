'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HistoryRange } from '@/types/portfolio';
import { apiPatch } from '@/lib/apiClient';

export interface StockPriceHistoryItem {
  snapshotId: string;
  date: string;
  price: number | null;
  shares: number;
  value: number;
  cost: number;
}

export function useStockPriceHistory(stockId: string | undefined) {
  const [range, setRange] = useState<HistoryRange>('3M');
  const [data, setData] = useState<StockPriceHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (r: HistoryRange) => {
    if (!stockId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stocks/${stockId}/price-history?range=${r}`);
      if (!res.ok) throw new Error('株価履歴の取得に失敗しました');
      const json = await res.json();
      setData(json.history || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setIsLoading(false);
    }
  }, [stockId]);

  useEffect(() => {
    fetchHistory(range);
  }, [range, fetchHistory]);

  // スナップショット記録イベントを検知して再取得
  useEffect(() => {
    const handler = () => {
      setTimeout(() => fetchHistory(range), 500);
    };
    window.addEventListener('kabunote-snapshot-created', handler);
    return () => window.removeEventListener('kabunote-snapshot-created', handler);
  }, [range, fetchHistory]);

  // 過去スナップショットの株価を修正（評価額・損益・純資産も自動再計算）。
  // 既存の PATCH /api/portfolio/snapshot/[id] を再利用し、成功後に履歴を再取得して反映。
  const updateSnapshotPrice = useCallback(async (
    snapshotId: string,
    targetStockId: string,
    currentPrice: number,
  ): Promise<boolean> => {
    try {
      await apiPatch(`/api/portfolio/snapshot/${snapshotId}`, {
        stockPrices: [{ stockId: targetStockId, currentPrice }],
      });
      await fetchHistory(range);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '株価の修正に失敗しました');
      return false;
    }
  }, [range, fetchHistory]);

  return { data, range, setRange, isLoading, error, updateSnapshotPrice };
}
