import { useState, useEffect, useCallback } from 'react';
import { useDebouncedCallback } from './useDebounce';

/**
 * localStorage管理フック - 汎用版
 * @param key - localStorageのキー
 * @param initialValue - 初期値
 * @param debounceMs - デバウンス時間（ミリ秒）
 * @param parser - JSON.parse以外のパーサーを使う場合
 * @param stringifier - JSON.stringify以外のシリアライザーを使う場合
 * @returns [value, setValue, isLoading]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  debounceMs: number = 300,
  parser?: (value: string) => T,
  stringifier?: (value: T) => string
) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // デバウンスされた保存関数
  const debouncedSave = useDebouncedCallback((value: T) => {
    if (typeof window !== 'undefined') {
      try {
        const valueToStore = stringifier ? stringifier(value) : JSON.stringify(value);
        localStorage.setItem(key, valueToStore);
        console.log(`💾 localStorage保存: ${key}`, value);
      } catch (error) {
        console.error(`Failed to save to localStorage (${key}):`, error);
      }
    }
  }, debounceMs);

  // 初期化時にlocalStorageから読み込み
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(key);
        if (item !== null) {
          const parsedValue = parser ? parser(item) : JSON.parse(item);
          setStoredValue(parsedValue);
        }
      } catch (error) {
        console.error(`Failed to parse localStorage value (${key}):`, error);
        // パースエラーの場合は初期値を使用
        setStoredValue(initialValue);
      }
    }
    setIsLoading(false);
  }, [key, initialValue, parser]);

  // 値を設定する関数（即座にUI更新、デバウンスで保存）
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      debouncedSave(valueToStore);
    } catch (error) {
      console.error(`Failed to set value for localStorage (${key}):`, error);
    }
  }, [key, storedValue, debouncedSave]);

  return [storedValue, setValue, isLoading] as const;
}

/**
 * 文字列専用localStorage管理フック
 */
export function useStringLocalStorage(
  key: string,
  initialValue: string = '',
  debounceMs: number = 300
) {
  return useLocalStorage(
    key,
    initialValue,
    debounceMs,
    (value) => value, // そのまま返す
    (value) => value  // そのまま返す
  );
}

/**
 * 配列専用localStorage管理フック
 */
export function useArrayLocalStorage<T>(
  key: string,
  initialValue: T[] = [],
  debounceMs: number = 300
) {
  return useLocalStorage<T[]>(key, initialValue, debounceMs);
}

/**
 * オブジェクト専用localStorage管理フック
 */
export function useObjectLocalStorage<T extends Record<string, any>>(
  key: string,
  initialValue: T,
  debounceMs: number = 300
) {
  return useLocalStorage<T>(key, initialValue, debounceMs);
}