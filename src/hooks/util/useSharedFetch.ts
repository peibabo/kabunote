'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 全インスタンスでフェッチ結果を共有するキャッシュ。
 *
 * ダッシュボードは銘柄カードを同時にマウントするため、カード内のフックが
 * 素直に `useEffect` でフェッチすると同じリクエストがカード数ぶん飛ぶ
 * （Sentry の N+1 API Call）。同一キーのインスタンスは進行中の Promise を
 * 共有し、結果が届いたら購読者全員に配る。
 *
 * `createCachedSettingsHook` はエンドポイント固定・値1つのキャッシュだが、
 * こちらは任意のキー（期間や銘柄など）で引けるのが違い。
 */
interface CacheEntry<T> {
  data?: T;
  error?: string;
  /** 一度でも取得を試みたか（失敗後に isLoading を解除するため） */
  loaded: boolean;
  /** 進行中のリクエスト。同一キーの同時マウントはこれを共有する */
  promise?: Promise<void>;
  /** 再取得（invalidate）用に最後に使った fetcher を保持する */
  fetcher?: (key: string) => Promise<unknown>;
  subscribers: Set<() => void>;
}

const cache = new Map<string, CacheEntry<unknown>>();

function entryFor<T>(key: string): CacheEntry<T> {
  let entry = cache.get(key);
  if (!entry) {
    entry = { loaded: false, subscribers: new Set() };
    cache.set(key, entry);
  }
  return entry as CacheEntry<T>;
}

function notify(entry: CacheEntry<unknown>): void {
  entry.subscribers.forEach(fn => fn());
}

function startFetch<T>(key: string, fetcher: (key: string) => Promise<T>): Promise<void> {
  const entry = entryFor<T>(key);
  entry.fetcher = fetcher as (key: string) => Promise<unknown>;
  if (entry.promise) return entry.promise;

  entry.promise = (async () => {
    try {
      entry.data = await fetcher(key);
      entry.error = undefined;
    } catch (e) {
      entry.error = e instanceof Error ? e.message : '取得に失敗しました';
    } finally {
      entry.loaded = true;
      entry.promise = undefined;
      notify(entry);
    }
  })();

  return entry.promise;
}

/**
 * キャッシュ値を手元で書き換える（保存・削除後の楽観的更新）。
 * 同一キーの全インスタンスに反映される。
 */
export function mutateShared<T>(key: string, updater: (prev: T | undefined) => T): void {
  const entry = entryFor<T>(key);
  entry.data = updater(entry.data);
  entry.loaded = true;
  notify(entry);
}

/**
 * 条件に一致するキーを破棄し、購読者がいるものは再取得する。
 * 購読者がいないキーは次回マウント時に取得されるので捨てるだけでよい。
 */
export function invalidateShared(predicate: (key: string) => boolean): void {
  for (const [key, entry] of cache) {
    if (!predicate(key)) continue;
    entry.data = undefined;
    entry.loaded = false;
    if (entry.subscribers.size > 0 && entry.fetcher) {
      void startFetch(key, entry.fetcher);
    } else {
      cache.delete(key);
    }
    notify(entry);
  }
}

/**
 * キャッシュを完全に破棄する。
 * ログアウト時は必ず呼ぶこと（同一タブで別ユーザーがログインした際に
 * 前のユーザーのデータが残るため）。テストのリセットにも使う。
 */
export function clearSharedFetchCache(): void {
  for (const entry of cache.values()) {
    entry.data = undefined;
    entry.loaded = false;
    notify(entry);
  }
  cache.clear();
}

export interface UseSharedFetchReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * キー単位でフェッチ結果を共有するフック。
 *
 * @param key キャッシュキー。null の間はフェッチしない
 * @param fetcher キーを受け取って値を返す関数。毎レンダリング新しい関数でよい
 *                （ref に退避するため識別子は依存に含めない。キーが同じなら同じ取得とみなす）
 */
export function useSharedFetch<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>
): UseSharedFetchReturn<T> {
  const fetcherRef = useRef(fetcher);
  useEffect(() => { fetcherRef.current = fetcher; });

  const [, forceRender] = useState(0);

  useEffect(() => {
    if (key === null) return;

    const entry = entryFor<T>(key);
    const onChange = () => forceRender(n => n + 1);
    entry.subscribers.add(onChange);

    // 未取得のときだけ開始する。進行中なら startFetch 側で Promise を共有する
    if (!entry.loaded && !entry.promise) {
      void startFetch<T>(key, k => fetcherRef.current(k));
    } else {
      // 既にキャッシュ済み。マウント直後の値を反映させる
      onChange();
    }

    return () => { entry.subscribers.delete(onChange); };
  }, [key]);

  const entry = key === null ? undefined : (cache.get(key) as CacheEntry<T> | undefined);

  const refetch = useCallback(async () => {
    if (key === null) return;
    await startFetch<T>(key, k => fetcherRef.current(k));
  }, [key]);

  return {
    data: entry?.data,
    isLoading: key !== null && !entry?.loaded,
    error: entry?.error ?? null,
    refetch,
  };
}
