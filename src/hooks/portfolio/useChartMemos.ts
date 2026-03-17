'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, apiPut } from '@/lib/apiClient';
import type { HistoryRange, ChartMemoData, ChartMemoMap, ChartType } from '@/types/portfolio';
import { chartMemoKey } from '@/types/portfolio';

export function useChartMemos(range: HistoryRange) {
  const [memos, setMemos] = useState<ChartMemoData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchMemos = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<ChartMemoData[]>(
        `/api/portfolio/chart-memos?range=${range}`
      );
      if (mountedRef.current) setMemos(data);
    } catch {
      // エラー時は空配列を維持
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchMemos();
  }, [fetchMemos]);

  // O(1)ルックアップ用Map
  const memoMap: ChartMemoMap = new Map(
    memos.map(m => [chartMemoKey(m.snapshotDate, m.chartType as ChartType, m.symbol), m])
  );

  const saveMemo = useCallback(async (
    snapshotDate: string,
    chartType: ChartType,
    symbol: string | undefined,
    content: string
  ): Promise<boolean> => {
    try {
      const saved = await apiPut<ChartMemoData>('/api/portfolio/chart-memos', {
        snapshotDate,
        chartType,
        symbol: symbol || '',
        content,
      });
      // ローカル更新
      setMemos(prev => {
        const key = chartMemoKey(snapshotDate, chartType, symbol);
        const exists = prev.findIndex(m =>
          chartMemoKey(m.snapshotDate, m.chartType as ChartType, m.symbol) === key
        );
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = saved;
          return next;
        }
        return [...prev, saved];
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const deleteMemo = useCallback(async (
    snapshotDate: string,
    chartType: ChartType,
    symbol?: string
  ): Promise<boolean> => {
    const params = new URLSearchParams({
      snapshotDate,
      chartType,
      symbol: symbol || '',
    });
    try {
      await apiFetch<void>(
        `/api/portfolio/chart-memos?${params.toString()}`,
        { method: 'DELETE' }
      );
      // ローカル削除
      const key = chartMemoKey(snapshotDate, chartType, symbol);
      setMemos(prev => prev.filter(m =>
        chartMemoKey(m.snapshotDate, m.chartType as ChartType, m.symbol) !== key
      ));
      return true;
    } catch {
      return false;
    }
  }, []);

  return { memos, memoMap, isLoading, saveMemo, deleteMemo, refetch: fetchMemos };
}
