'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PortfolioSnapshotData, HistoryRange } from '@/types/portfolio';
import { grantXp } from '@/lib/gamification';

export function usePortfolioHistory() {
  const [range, setRange] = useState<HistoryRange>('1M');
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

      const now = new Date();
      const jstOffset = 9 * 60;
      const jstDate = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
      const todayStr = `${jstDate.getFullYear()}-${String(jstDate.getMonth() + 1).padStart(2, '0')}-${String(jstDate.getDate()).padStart(2, '0')}`;
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
    fetchHistory(range);
  }, [range, fetchHistory]);

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
