'use client';

import { useState, useEffect } from 'react';
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
 * - SSR安全（初回はdefaultExpandedでレンダリング、マウント後にlocalStorageの値を適用）
 */
export function useAccordionState({
  storageKey,
  defaultExpanded = false,
}: UseAccordionStateOptions = {}) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // マウント後にlocalStorageの値を適用（hydrationミスマッチ回避）
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        setIsExpanded(saved === 'true');
      }
    }
  }, [storageKey]);

  const toggle = () => {
    const next = !isExpanded;
    playSound(next ? 'accordionOpen' : 'accordionClose');
    setIsExpanded(next);
    if (storageKey) {
      localStorage.setItem(storageKey, String(next));
    }
  };

  return { isExpanded, toggle } as const;
}
