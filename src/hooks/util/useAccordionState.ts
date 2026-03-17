'use client';

import { useState } from 'react';
import { playSound } from '@/lib/sound';

interface UseAccordionStateOptions {
  /** localStorageに保存するキー。省略時はlocalStorage保存なし */
  storageKey?: string;
  /** 初期値（storageKeyが指定されている場合はlocalStorageの値が優先） */
  defaultExpanded?: boolean;
}

/**
 * アコーディオンの開閉状態を管理するフック
 * - playSound統合
 * - localStorage保存あり/なし対応
 */
export function useAccordionState({
  storageKey,
  defaultExpanded = false,
}: UseAccordionStateOptions = {}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return defaultExpanded;
  });

  const toggle = () => {
    const next = !isExpanded;
    playSound(next ? 'accordionOpen' : 'accordionClose');
    setIsExpanded(next);
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, String(next));
    }
  };

  return { isExpanded, toggle } as const;
}
