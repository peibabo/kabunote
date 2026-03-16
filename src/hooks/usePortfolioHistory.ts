'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PortfolioSnapshotData, HistoryRange } from '@/types/portfolio';

export function usePortfolioHistory() {
  const [range, setRange] = useState<HistoryRange>('1M');
  const [data, setData] = useState<PortfolioSnapshotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [todayRecorded, setTodayRecorded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (r: HistoryRange) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portfolio/history?range=${r}`);
      if (!res.ok) throw new Error('履歴の取得に失敗しました');
      const json = await res.json();
      const snapshots: PortfolioSnapshotData[] = json.data || [];
      setData(snapshots);

      // 今日の記録があるか確認（JST基準）
      const now = new Date();
      const jstOffset = 9 * 60;
      const jstDate = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
      const todayStr = `${jstDate.getFullYear()}-${String(jstDate.getMonth() + 1).padStart(2, '0')}-${String(jstDate.getDate()).padStart(2, '0')}`;
      setTodayRecorded(snapshots.some(s => s.snapshotDate === todayStr));
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(range);
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
      // 履歴を再取得
      await fetchHistory(range);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : '不明なエラー');
      return false;
    } finally {
      setIsCreating(false);
    }
  }, [range, fetchHistory]);

  return {
    data,
    range,
    setRange,
    isLoading,
    isCreating,
    todayRecorded,
    error,
    createSnapshot,
  };
}
