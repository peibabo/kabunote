'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface TooltipPosition {
  x: number;
  y: number;
}

/**
 * ツールチップの表示/非表示を管理するフック
 * - hideTimeoutRef + clearHideTimeout パターンを共通化
 * - クリーンアップ自動実行
 */
export function useTooltipState<T = null>(hideDelay: number = 150) {
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: T | null;
  }>({ show: false, x: 0, y: 0, data: null });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const show = useCallback((position: TooltipPosition, data: T) => {
    clearHideTimeout();
    setTooltip({ show: true, ...position, data });
  }, [clearHideTimeout]);

  const hide = useCallback(() => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  }, []);

  const scheduleHide = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      hide();
    }, hideDelay);
  }, [hide, hideDelay]);

  const handleTooltipEnter = useCallback(() => {
    clearHideTimeout();
  }, [clearHideTimeout]);

  const handleTooltipLeave = useCallback(() => {
    clearHideTimeout();
    hide();
  }, [clearHideTimeout, hide]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return {
    tooltip,
    show,
    hide,
    scheduleHide,
    clearHideTimeout,
    handleTooltipEnter,
    handleTooltipLeave,
  } as const;
}
