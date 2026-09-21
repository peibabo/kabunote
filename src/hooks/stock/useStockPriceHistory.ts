'use client';

import { useState, useCallback } from 'react';
import type { HistoryRange, StockPriceHistoryItem } from '@/types/portfolio';
import { parseHistoryRange } from '@/types/portfolio';
import { useLocalStorage } from '@/hooks/util/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { patchSnapshotPrices } from '@/lib/apiClient';
import { useAppEvent } from '@/hooks/util/useAppEvent';
import { APP_EVENTS } from '@/lib/appEvents';
import { useSharedFetch, invalidateShared } from '@/hooks/util/useSharedFetch';
import { loadPriceHistory } from '@/lib/priceHistoryLoader';

export type { StockPriceHistoryItem };

/** 共有キャッシュのキー接頭辞。一括無効化の判定にも使う */
const CACHE_PREFIX = 'stock-price-history|';

const EMPTY: StockPriceHistoryItem[] = [];

/** スナップショット更新後に全銘柄・全期間の株価履歴を再取得させる */
function invalidatePriceHistory(): void {
  invalidateShared(key => key.startsWith(CACHE_PREFIX));
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

  // localStorage読込前はフェッチしない（初期値→保存値での二重フェッチ回避）。
  // 取得は銘柄ごとにキャッシュしつつ、HTTPリクエストは期間単位で1本に束ねられる
  // （`loadPriceHistory` が同一フレームの要求をまとめる）
  const key = (!stockId || rangeLoading) ? null : `${CACHE_PREFIX}${range}|${stockId}`;
  const { data, isLoading, error: fetchError, refetch } = useSharedFetch<StockPriceHistoryItem[]>(
    key,
    () => loadPriceHistory(stockId as string, range),
  );

  // 株価修正の失敗は取得エラーと別管理（共有キャッシュのエラーは他インスタンスにも波及するため）
  const [updateError, setUpdateError] = useState<string | null>(null);

  // スナップショット記録イベントを検知して再取得。
  // 記録直後はDB反映が遅れることがあるため少し待つ（従来動作を踏襲）
  useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, () => {
    setTimeout(() => invalidatePriceHistory(), 500);
  });

  // 過去スナップショットの株価を修正（評価額・損益・純資産も自動再計算）。
  // 既存の PATCH /api/portfolio/snapshot/[id] を再利用し、成功後に履歴を再取得して反映。
  // 修正は他銘柄の評価額にも影響しうるため、当該銘柄だけでなく全キーを無効化する。
  const updateSnapshotPrice = useCallback(async (
    snapshotId: string,
    targetStockId: string,
    currentPrice: number,
  ): Promise<boolean> => {
    try {
      setUpdateError(null);
      await patchSnapshotPrices(snapshotId, [{ stockId: targetStockId, currentPrice }]);
      invalidatePriceHistory();
      return true;
    } catch (e) {
      setUpdateError(e instanceof Error ? e.message : '株価の修正に失敗しました');
      return false;
    }
  }, []);

  return {
    data: data ?? EMPTY,
    range,
    setRange,
    isLoading,
    error: updateError ?? fetchError,
    updateSnapshotPrice,
    refetch,
  };
}
