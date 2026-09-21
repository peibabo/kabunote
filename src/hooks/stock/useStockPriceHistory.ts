'use client';

import { useCallback } from 'react';
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

const cacheKey = (range: HistoryRange, stockId: string) => `${CACHE_PREFIX}${range}|${stockId}`;

/**
 * キーから取得条件を復元して問い合わせる。
 * `useSharedFetch` の fetcher はキーだけから内容が決まる必要があるため
 * （クロージャの range/stockId を見ると、再取得時にキーと中身が食い違う）。
 * range も stockId(cuid) も `|` を含まないため単純分割でよい。
 */
function fetchByCacheKey(key: string): Promise<StockPriceHistoryItem[]> {
  const [, range, stockId] = key.split('|');
  return loadPriceHistory(stockId, range);
}

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
  const key = (!stockId || rangeLoading) ? null : cacheKey(range, stockId);
  const { data, isLoading, error, refetch } = useSharedFetch<StockPriceHistoryItem[]>(
    key,
    fetchByCacheKey,
  );

  // スナップショット記録イベントを検知して再取得。
  // 記録直後はDB反映が遅れることがあるため少し待つ（従来動作を踏襲）
  useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, () => {
    setTimeout(() => invalidatePriceHistory(), 500);
  });

  // 過去スナップショットの株価を修正（評価額・損益・純資産も自動再計算）。
  // 既存の PATCH /api/portfolio/snapshot/[id] を再利用し、成功後に履歴を再取得して反映。
  // 修正は他銘柄の評価額にも影響しうるため、当該銘柄だけでなく全キーを無効化する。
  //
  // 失敗は false を返すだけにとどめ、`error`（＝取得エラー）には載せない。
  // 呼び出し元の `ChartSnapshotEditor` が自前でメッセージを出すうえ、
  // `StockMiniChart` は error があるとチャートごとエラー表示に差し替えるため、
  // ここに載せると修正の失敗でチャートが消えて戻らなくなる。
  const updateSnapshotPrice = useCallback(async (
    snapshotId: string,
    targetStockId: string,
    currentPrice: number,
  ): Promise<boolean> => {
    try {
      await patchSnapshotPrices(snapshotId, [{ stockId: targetStockId, currentPrice }]);
      invalidatePriceHistory();
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    data: data ?? EMPTY,
    range,
    setRange,
    isLoading,
    error,
    updateSnapshotPrice,
    refetch,
  };
}
