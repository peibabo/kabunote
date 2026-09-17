'use client';

import { useEffect, useRef } from 'react';
import type { AppEventDetailMap } from '@/lib/appEvents';

interface UseAppEventOptions {
  /** false の間はリスナーを登録しない（初期化前など） */
  enabled?: boolean;
}

/**
 * アプリ内カスタムイベント（`APP_EVENTS`）を購読する。
 *
 * ```ts
 * useAppEvent(APP_EVENTS.DB_TAG_UPDATE, (detail) => {
 *   updateStockData(detail.symbol, { tags: detail.tags })
 * })
 * ```
 *
 * handler は ref に保持するため、毎レンダリングで新しい関数を渡しても
 * リスナーは登録し直されない（呼び出し側で useCallback を書く必要がない）。
 */
export function useAppEvent<K extends keyof AppEventDetailMap>(
  eventName: K,
  handler: (detail: AppEventDetailMap[K]) => void,
  options?: UseAppEventOptions
): void {
  // 最新の handler を ref に保持（描画中は書き換えない）
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) return;

    const listener = (e: Event) => {
      handlerRef.current((e as CustomEvent<AppEventDetailMap[K]>).detail);
    };

    window.addEventListener(eventName as string, listener);
    return () => window.removeEventListener(eventName as string, listener);
  }, [eventName, enabled]);
}
