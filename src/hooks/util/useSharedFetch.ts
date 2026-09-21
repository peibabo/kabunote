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
  /** 取得が確定したか（成功・失敗の両方。失敗後に isLoading を解除するため） */
  loaded: boolean;
  /** 進行中のリクエスト。同一キーの同時マウントはこれを共有する */
  promise?: Promise<void>;
  /**
   * 世代番号。`invalidateShared` で加算する。
   * 進行中リクエストは自分の世代とズレたら結果を捨てる
   * （無効化前に飛んだ古いレスポンスを「最新」として確定させないため）。
   */
  generation: number;
  /** 再取得（invalidate）用に最後に使った fetcher を保持する */
  fetcher?: (key: string) => Promise<unknown>;
  subscribers: Set<() => void>;
}

const cache = new Map<string, CacheEntry<unknown>>();

function entryFor<T>(key: string): CacheEntry<T> {
  let entry = cache.get(key);
  if (!entry) {
    entry = { loaded: false, generation: 0, subscribers: new Set() };
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

  const generation = entry.generation;
  const isCurrent = () => entry.generation === generation;

  entry.promise = (async () => {
    try {
      const data = await fetcher(key);
      if (!isCurrent()) return;
      entry.data = data;
      entry.error = undefined;
    } catch (e) {
      if (!isCurrent()) return;
      entry.error = e instanceof Error ? e.message : '取得に失敗しました';
    } finally {
      // 世代がズレている＝ invalidate 済み。新しいリクエストの promise を消さないよう触らない
      if (isCurrent()) {
        entry.loaded = true;
        entry.promise = undefined;
        notify(entry);
      }
    }
  })();

  return entry.promise;
}

/** 購読開始時に取得すべきか。失敗したエントリは次の購読で再試行する */
function needsFetch(entry: CacheEntry<unknown>): boolean {
  if (entry.promise) return false;
  return !entry.loaded || entry.error !== undefined;
}

/** 世代を進めて進行中リクエストを無効化し、未取得状態に戻す */
function reset(entry: CacheEntry<unknown>): void {
  entry.generation += 1;
  entry.data = undefined;
  entry.error = undefined;
  entry.loaded = false;
  entry.promise = undefined;
}

/**
 * キャッシュ値を手元で書き換える（保存・削除後の楽観的更新）。
 * 同一キーの全インスタンスに反映される。
 *
 * まだ誰も取得していないキーには何もしない。取得前に値を差し込むと
 * 「取得済みだが fetcher が無い」エントリができ、以後一切取得されなくなるため。
 */
export function mutateShared<T>(key: string, updater: (prev: T | undefined) => T): void {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return;
  entry.data = updater(entry.data);
  entry.error = undefined;
  entry.loaded = true;
  notify(entry);
}

/**
 * 条件に一致するキーを破棄し、購読者がいるものは再取得する。
 * 購読者がいないキーは次回マウント時に取得されるので捨てるだけでよい。
 */
export function invalidateShared(predicate: (key: string) => boolean): void {
  for (const [key, entry] of [...cache]) {
    if (!predicate(key)) continue;
    reset(entry);
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
 *
 * 購読中のキーは `invalidateShared` と同じ扱い（破棄＋再取得）。
 * 単に消すだけだと、マウントしたままのコンポーネントが
 * 再取得の契機を失って永久に読み込み中のまま固まる。
 */
export function clearSharedFetchCache(): void {
  invalidateShared(() => true);
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
 * **fetcher は引数の `key` だけから取得内容を決めること。**
 * fetcher はエントリに保持され、`invalidateShared` の再取得では
 * 別インスタンス（既にアンマウントしている場合もある）が登録したものが呼ばれる。
 * クロージャの変数（期間や銘柄）を参照すると、キーと中身が食い違ったデータが
 * キャッシュに入りうる。必要な情報はすべてキーに載せて、fetcher 側で解くこと。
 *
 * @param key キャッシュキー。null の間はフェッチしない
 * @param fetcher キーを受け取って値を返す関数。毎レンダリング新しい関数でよい
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

    if (needsFetch(entry)) {
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
