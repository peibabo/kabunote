import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from './useDebounce';
import { getTodayDateString } from '@/lib/checklistCalc';
import { playSound } from '@/lib/sound';
import type { ChecklistStreakInfo } from '@/types/checklist';

interface ChecklistData {
  checkedItems: number[];
  streak: ChecklistStreakInfo;
}

interface UseChecklistResult {
  checkedItems: number[];
  streak: ChecklistStreakInfo;
  isLoading: boolean;
  toggleItem: (index: number) => void;
}

const DEFAULT_STREAK: ChecklistStreakInfo = {
  currentStreak: 0,
  longestStreak: 0,
  totalCompletedDays: 0,
};

// Module-level cache
let cachedData: ChecklistData | null = null;
let fetchPromise: Promise<ChecklistData | null> | null = null;

const CHECKLIST_UPDATE_EVENT = 'kabunote-checklist-update';

// 自動チェック: イベント名 → チェックリストindex のマッピング
const AUTO_CHECK_EVENTS: Record<string, number> = {
  'kabunote-db-price-update': 0,    // 株価を更新した
  'kabunote-alert-reviewed': 1,     // アラートを確認した
  'kabunote-db-strategy-update': 2, // Next Actionを見直した
  'kabunote-db-memo-update': 3,     // 株ノオトを更新した
};

async function fetchChecklistOnce(): Promise<ChecklistData | null> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch('/api/checklist');
      if (!response.ok) throw new Error('チェックリストの取得に失敗しました');
      const data = await response.json();
      cachedData = {
        checkedItems: data.today.checkedItems,
        streak: data.streak,
      };
      return cachedData;
    } catch {
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useChecklist(): UseChecklistResult {
  const [checkedItems, setCheckedItems] = useState<number[]>(cachedData?.checkedItems ?? []);
  const [streak, setStreak] = useState<ChecklistStreakInfo>(cachedData?.streak ?? DEFAULT_STREAK);
  const [isLoading, setIsLoading] = useState<boolean>(cachedData === null);

  useEffect(() => {
    if (cachedData) {
      setCheckedItems(cachedData.checkedItems);
      setStreak(cachedData.streak);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchChecklistOnce().then(data => {
      if (cancelled) return;
      if (data) {
        setCheckedItems(data.checkedItems);
        setStreak(data.streak);
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Listen for updates from other instances
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ChecklistData>).detail;
      setCheckedItems(detail.checkedItems);
      setStreak(detail.streak);
    };
    window.addEventListener(CHECKLIST_UPDATE_EVENT, handler);
    return () => window.removeEventListener(CHECKLIST_UPDATE_EVENT, handler);
  }, []);

  const debouncedSaveToApi = useDebouncedCallback(async (items: number[]) => {
    try {
      const response = await fetch('/api/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: getTodayDateString(),
          checkedItems: items,
        }),
      });
      if (!response.ok) throw new Error('チェックリストの更新に失敗しました');
      const data = await response.json();
      // Update streak from server response
      const newData: ChecklistData = {
        checkedItems: data.today.checkedItems,
        streak: data.streak,
      };
      cachedData = newData;
      setStreak(newData.streak);
      window.dispatchEvent(new CustomEvent(CHECKLIST_UPDATE_EVENT, { detail: newData }));
    } catch (err) {
      console.error('チェックリスト更新エラー:', err);
    }
  }, 300);

  const toggleItem = useCallback((index: number) => {
    if (!cachedData) return;
    setCheckedItems(prev => {
      const newItems = prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index].sort();

      // Optimistic update
      const optimistic: ChecklistData = {
        checkedItems: newItems,
        streak: cachedData?.streak ?? DEFAULT_STREAK,
      };
      cachedData = optimistic;
      window.dispatchEvent(new CustomEvent(CHECKLIST_UPDATE_EVENT, { detail: optimistic }));

      debouncedSaveToApi(newItems);
      return newItems;
    });
  }, [debouncedSaveToApi]);

  // 自動チェック: 各操作イベントをリッスンして未チェック項目を自動チェック
  const autoCheck = useCallback((index: number) => {
    // 初期データ未読み込み時はスキップ（API保存の競合を防ぐ）
    if (!cachedData) return;

    setCheckedItems(prev => {
      if (prev.includes(index)) return prev; // 既にチェック済み
      const newItems = [...prev, index].sort();

      playSound('toggle');

      const optimistic: ChecklistData = {
        checkedItems: newItems,
        streak: cachedData?.streak ?? DEFAULT_STREAK,
      };
      cachedData = optimistic;
      window.dispatchEvent(new CustomEvent(CHECKLIST_UPDATE_EVENT, { detail: optimistic }));

      debouncedSaveToApi(newItems);
      return newItems;
    });
  }, [debouncedSaveToApi]);

  useEffect(() => {
    const handlers = Object.entries(AUTO_CHECK_EVENTS).map(([event, index]) => {
      const handler = () => autoCheck(index);
      window.addEventListener(event, handler);
      return { event, handler };
    });
    return () => {
      handlers.forEach(({ event, handler }) => window.removeEventListener(event, handler));
    };
  }, [autoCheck]);

  return { checkedItems, streak, isLoading, toggleItem };
}
