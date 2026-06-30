'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PortfolioSnapshotData, HistoryRange } from '@/types/portfolio';
import { parseHistoryRange } from '@/types/portfolio';
import { useLocalStorage } from '@/hooks/util/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { grantXp } from '@/lib/gamification';
import { getTodayJST } from '@/lib/dateJst';
import { patchSnapshotPrices } from '@/lib/apiClient';

export function usePortfolioHistory() {
  // 選択中期間をlocalStorageに永続化（リロード後も維持）
  const [range, setRange, rangeLoading] = useLocalStorage<HistoryRange>(
    STORAGE_KEYS.PORTFOLIO_HISTORY_RANGE,
    '1M',
    100,
    (v) => parseHistoryRange(v, '1M'),
    (v) => v,
  );
  const [data, setData] = useState<PortfolioSnapshotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [todayRecorded, setTodayRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const fetchHistory = useCallback(async (r: HistoryRange) => {
    if (isInitialLoad.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(`/api/portfolio/history?range=${r}`);
      if (!res.ok) throw new Error('履歴の取得に失敗しました');
      const json = await res.json();
      const snapshots: PortfolioSnapshotData[] = json.data || [];
      setData(snapshots);

      const todayStr = getTodayJST();
      const found = snapshots.some(s => s.snapshotDate === todayStr);
      // 一度 true になったら false に戻さない（記録直後のDB遅延対策）
      if (found) {
        setTodayRecorded(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setIsLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    // localStorage読込前はフェッチしない（初期値→保存値での二重フェッチ回避）
    if (rangeLoading) return;
    fetchHistory(range);
  }, [range, rangeLoading, fetchHistory]);

  // 外部（フローティングボタン等）からの記録完了を検知
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    const handler = () => {
      setTodayRecorded(true);
      timerId = setTimeout(() => fetchHistory(range), 500);
    };
    window.addEventListener('kabunote-snapshot-created', handler);
    return () => {
      clearTimeout(timerId);
      window.removeEventListener('kabunote-snapshot-created', handler);
    };
  }, [range, fetchHistory]);

  const createSnapshot = useCallback(async () => {
    setIsCreating(true);
    setError(null);
    try {
      const res = await fetch('/api/portfolio/snapshot', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'スナップショットの作成に失敗しました');
      }
      setTodayRecorded(true);
      await fetchHistory(range);
      grantXp('PORTFOLIO_SNAPSHOT')
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [range, fetchHistory]);

  // 過去スナップショットの個別株価を修正（評価額・損益・純資産も自動再計算）
  const updateSnapshotPrices = useCallback(async (
    snapshotId: string,
    prices: { stockId: string; currentPrice: number }[],
  ): Promise<boolean> => {
    try {
      const updated = await patchSnapshotPrices<PortfolioSnapshotData>(snapshotId, prices);
      // レスポンスで該当スナップショットを差し替え → グラフ再描画
      setData(prev => prev.map(s => s.id === snapshotId ? updated : s));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '株価の修正に失敗しました');
      return false;
    }
  }, []);

  return {
    data,
    range,
    setRange,
    isLoading,
    isCreating,
    todayRecorded,
    error,
    createSnapshot,
    updateSnapshotPrices,
  };
}
