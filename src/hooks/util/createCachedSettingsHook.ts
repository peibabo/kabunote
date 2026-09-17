'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { apiFetch, apiPut } from '@/lib/apiClient';
import { useAppEvent } from '@/hooks/util/useAppEvent';
import { emitAppEvent } from '@/lib/appEvents';
import type { AppEventDetailMap, DetailedAppEventName } from '@/lib/appEvents';

interface CachedSettingsConfig<K extends DetailedAppEventName> {
  /** GET / PUT 先のAPIエンドポイント */
  endpoint: string;
  /** PUT のリクエストボディのキー（例: 'links' → `{ links: value }`） */
  bodyKey: string;
  /** 他インスタンスへ更新を伝えるイベント。detail が設定値そのものである必要がある */
  eventName: K;
  /** 未設定（APIが null を返す）ときに使う既定値 */
  defaultValue: AppEventDetailMap[K];
  /** 保存失敗時、サーバーがメッセージを返さなかった場合に表示する文言 */
  saveErrorMessage: string;
}

/**
 * apiClient はサーバーがメッセージを返さないとき `HTTP 500` のような文字列を投げる。
 * ユーザーに見せるのはドメインごとの日本語メッセージなので、その場合は差し替える。
 */
function toUserMessage(err: unknown, fallback: string): string {
  const raw = err instanceof Error ? err.message : '';
  return raw && !/^HTTP \d+$/.test(raw) ? raw : fallback;
}

export interface CachedSettingsResult<T> {
  value: T;
  isLoading: boolean;
  save: (value: T) => Promise<void>;
}

/**
 * 「全インスタンスでキャッシュを共有する設定フック」を生成するファクトリ。
 *
 * 外部リンク設定・銘柄リンク設定のように、
 * - モジュールスコープのキャッシュを共有し、同時マウントでも fetch は1回だけ
 * - 保存後はキャッシュを更新してイベントで他インスタンスへ伝播
 * という同一構造を持つフックのために使う。
 *
 * 返り値のプロパティ名は `value` / `save` で固定。呼び出し側のフックで
 * ドメインに合った名前（links / settings など）に付け替えること。
 */
export function createCachedSettingsHook<K extends DetailedAppEventName>(
  config: CachedSettingsConfig<K>
): () => CachedSettingsResult<AppEventDetailMap[K]> {
  type Value = AppEventDetailMap[K];

  // このファクトリ呼び出しごとに1つ。全フックインスタンスで共有する
  let cached: Value | null = null;
  let fetchPromise: Promise<Value | null> | null = null;

  async function fetchOnce(): Promise<Value | null> {
    if (cached) return cached;
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
      try {
        // data: null → 未設定、既定値を使用
        const data = await apiFetch<Value | null>(config.endpoint);
        const value = data ?? config.defaultValue;
        cached = value;
        return value;
      } catch {
        return null;
      } finally {
        fetchPromise = null;
      }
    })();

    return fetchPromise;
  }

  return function useCachedSettings(): CachedSettingsResult<Value> {
    const [value, setValue] = useState<Value>(cached ?? config.defaultValue);
    const [isLoading, setIsLoading] = useState<boolean>(cached === null);

    useEffect(() => {
      if (cached) {
        setValue(cached);
        setIsLoading(false);
        return;
      }

      let cancelled = false;
      fetchOnce().then(data => {
        if (cancelled) return;
        if (data) setValue(data);
        setIsLoading(false);
      });
      return () => { cancelled = true; };
    }, []);

    // 他インスタンスの保存を反映
    useAppEvent(config.eventName, (detail) => setValue(detail as Value));

    const save = useCallback(async (newValue: Value) => {
      try {
        const saved = await apiPut<Value | null>(config.endpoint, { [config.bodyKey]: newValue });
        const result = saved ?? newValue;

        cached = result;
        setValue(result);
        emitAppEvent(config.eventName, result);
      } catch (err) {
        toast.error(toUserMessage(err, config.saveErrorMessage));
        throw err;
      }
    }, []);

    return { value, isLoading, save };
  };
}
