import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * デバウンスフック - DB保存の最適化のため
 * @param value - デバウンスしたい値
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされた値
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * デバウンスコールバックフック - 関数実行をデバウンス
 * @param callback - 実行したい関数
 * @param delay - 遅延時間（ミリ秒）
 * @returns デバウンスされたコールバック関数
 */
export const useDebouncedCallback = <T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) => {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((...args: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return debouncedCallback;
};