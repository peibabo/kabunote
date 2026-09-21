'use client';

import { useCallback, useMemo } from 'react';
import { apiFetch, apiPut } from '@/lib/apiClient';
import type { HistoryRange, ChartMemoData, ChartMemoMap, ChartType } from '@/types/portfolio';
import { chartMemoKey } from '@/types/portfolio';
import { useSharedFetch, mutateShared, invalidateShared } from '@/hooks/util/useSharedFetch';

/**
 * 共有キャッシュのキー。
 * このフックは銘柄ミニチャート（カード数ぶん同時マウント）とポートフォリオ推移の
 * 双方から呼ばれ、**全インスタンスが完全に同じURL**を叩いていたため、
 * 期間ごとに1回だけ取得して共有する（N+1 API Call 対策）。
 */
const CACHE_PREFIX = 'chart-memos|';
const cacheKey = (range: HistoryRange) => `${CACHE_PREFIX}${range}`;

/**
 * キーから期間を復元して取得する。
 * `useSharedFetch` の fetcher はキーだけから内容が決まる必要があるため
 * （クロージャの range を見ると、再取得時にキーと中身が食い違う）。
 */
function fetchByCacheKey(key: string): Promise<ChartMemoData[]> {
  const range = key.slice(CACHE_PREFIX.length);
  return apiFetch<ChartMemoData[]>(`/api/portfolio/chart-memos?range=${range}`);
}

/**
 * 編集中の期間以外のキャッシュを破棄する。
 * メモは期間で絞って取得するため、保存・削除した1件は他の期間のリストにも影響する。
 * キャッシュはセッション中失効しないので、ここで捨てないと期間を切り替えたときに
 * 古いリスト（保存したメモが出ない／消したメモが復活する）が使われてしまう。
 */
function invalidateOtherRanges(currentKey: string): void {
  invalidateShared(key => key.startsWith(CACHE_PREFIX) && key !== currentKey);
}

const EMPTY: ChartMemoData[] = [];

export function useChartMemos(range: HistoryRange) {
  const key = cacheKey(range);
  const { data, isLoading, refetch } = useSharedFetch<ChartMemoData[]>(key, fetchByCacheKey);

  const memos = data ?? EMPTY;

  // O(1)ルックアップ用Map
  const memoMap: ChartMemoMap = useMemo(
    () => new Map(memos.map(m => [chartMemoKey(m.snapshotDate, m.chartType as ChartType, m.symbol), m])),
    [memos],
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
      // 共有キャッシュを更新（同じ期間を見ている他のチャートにも反映される）
      mutateShared<ChartMemoData[]>(cacheKey(range), prev => {
        const list = prev ?? [];
        const target = chartMemoKey(snapshotDate, chartType, symbol);
        const index = list.findIndex(m =>
          chartMemoKey(m.snapshotDate, m.chartType as ChartType, m.symbol) === target
        );
        if (index < 0) return [...list, saved];
        const next = [...list];
        next[index] = saved;
        return next;
      });
      invalidateOtherRanges(cacheKey(range));
      return true;
    } catch {
      return false;
    }
  }, [range]);

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
      const target = chartMemoKey(snapshotDate, chartType, symbol);
      mutateShared<ChartMemoData[]>(cacheKey(range), prev =>
        (prev ?? []).filter(m =>
          chartMemoKey(m.snapshotDate, m.chartType as ChartType, m.symbol) !== target
        )
      );
      invalidateOtherRanges(cacheKey(range));
      return true;
    } catch {
      return false;
    }
  }, [range]);

  return { memos, memoMap, isLoading, saveMemo, deleteMemo, refetch };
}
