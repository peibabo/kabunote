'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HistoryRange } from '@/types/portfolio';
import { parseHistoryRange } from '@/types/portfolio';
import { useLocalStorage } from '@/hooks/util/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { patchSnapshotPrices } from '@/lib/apiClient';
import { useAppEvent } from '@/hooks/util/useAppEvent';
import { APP_EVENTS } from '@/lib/appEvents';

export interface StockPriceHistoryItem {
  snapshotId: string;
  date: string;
  price: number | null;
  shares: number;
  value: number;
  cost: number;
}

export function useStockPriceHistory(stockId: string | undefined) {
  // 選択中期間をlocalStorageに永続化（全銘柄共通・リロード後も維持）
  const [range, setRange, rangeLoading] = useLocalStorage<HistoryRange>(
    STORAGE_KEYS.STOCK_MINI_CHART_RANGE,
    '3M',
    100,
    (v) => parseHistoryRange(v, '3M'),
    (v) => v,
  );
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
    // localStorage読込前はフェッチしない（初期値→保存値での二重フェッチ回避）
    if (rangeLoading) return;
    fetchHistory(range);
  }, [range, rangeLoading, fetchHistory]);

  // スナップショット記録イベントを検知して再取得
  useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, () => {
    setTimeout(() => fetchHistory(range), 500);
  });

  // 過去スナップショットの株価を修正（評価額・損益・純資産も自動再計算）。
  // 既存の PATCH /api/portfolio/snapshot/[id] を再利用し、成功後に履歴を再取得して反映。
  const updateSnapshotPrice = useCallback(async (
    snapshotId: string,
    targetStockId: string,
    currentPrice: number,
  ): Promise<boolean> => {
    try {
      await patchSnapshotPrices(snapshotId, [{ stockId: targetStockId, currentPrice }]);
      await fetchHistory(range);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '株価の修正に失敗しました');
      return false;
    }
  }, [range, fetchHistory]);

  return { data, range, setRange, isLoading, error, updateSnapshotPrice };
}
