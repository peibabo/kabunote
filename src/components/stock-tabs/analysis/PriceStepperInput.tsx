'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent, ReactNode } from 'react';
import { getTickSize, stepPriceUp, stepPriceDown } from '@/lib/tickSize';

interface PriceStepperInputProps {
  id: string;
  label: ReactNode;
  labelClassName: string;
  focusClassName: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  isTopix500: boolean;
  /** 未入力時に ± の起点にする価格（例: 現在の株価） */
  fallbackBase?: string;
}

type Direction = 'up' | 'down';

/** 長押しでリピートが始まるまでの待ち時間（ms） */
export const HOLD_DELAY_MS = 400;

/** 長押しのリピート間隔（ms）。押し続けるほど速くなる */
export const holdIntervalMs = (repeatCount: number) =>
  repeatCount < 5 ? 150 : repeatCount < 15 ? 80 : 40;

const formatTick = (tick: number) => tick.toLocaleString();

const parsePositive = (s: string | undefined) => {
  const n = parseFloat(s ?? '');
  return n > 0 ? n : null;
};

/**
 * 呼値単位で上下できる価格入力欄
 * スマホでは number input のスピンボタンが出ないため、自前の ▲▼ ボタンを置く（長押しで加速リピート）
 */
export default function PriceStepperInput({
  id,
  label,
  labelClassName,
  focusClassName,
  value,
  onChange,
  onBlur,
  isTopix500,
  fallbackBase,
}: PriceStepperInputProps) {
  const base = parsePositive(value) ?? parsePositive(fallbackBase);
  const tick = getTickSize(base ?? 0, isTopix500);

  // 長押し中のタイマーから最新の値と props を参照するため ref に保持する
  const latest = useRef({ value, fallbackBase, isTopix500, onChange });
  useEffect(() => {
    latest.current = { value, fallbackBase, isTopix500, onChange };
  }, [value, fallbackBase, isTopix500, onChange]);

  const step = useCallback((direction: Direction) => {
    const { value: current, fallbackBase: fb, isTopix500: topix, onChange: emit } = latest.current;
    const parsed = parsePositive(current);
    let next: number;
    if (parsed == null) {
      // 未入力で起点価格を使う場合は、まず起点価格そのものを入れる
      const fallback = parsePositive(fb);
      if (fallback == null) return;
      next = fallback;
    } else {
      next = direction === 'up' ? stepPriceUp(parsed, topix) : stepPriceDown(parsed, topix);
    }
    // 再レンダー前に次のリピートが走っても連続して進むよう、即座に反映しておく
    latest.current.value = String(next);
    emit(String(next));
  }, []);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const startHold = (direction: Direction) => {
    stopHold();
    step(direction);
    let repeatCount = 0;
    const repeat = () => {
      step(direction);
      holdTimer.current = setTimeout(repeat, holdIntervalMs(repeatCount++));
    };
    holdTimer.current = setTimeout(repeat, HOLD_DELAY_MS);
  };

  const buttonHandlers = (direction: Direction) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button > 0) return;
      // フォーカス移動とテキスト選択を防ぐ
      e.preventDefault();
      startHold(direction);
    },
    onPointerUp: () => {
      if (!holdTimer.current) return;
      stopHold();
      onBlur?.();
    },
    onPointerLeave: stopHold,
    onPointerCancel: stopHold,
    onContextMenu: (e: MouseEvent) => e.preventDefault(),
    // マウス・タッチは pointerdown で処理済み。キーボード（Enter/Space）操作のみ click で処理する
    onClick: (e: MouseEvent) => {
      if (e.detail === 0) step(direction);
    },
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    step(e.key === 'ArrowUp' ? 'up' : 'down');
  };

  const buttonClass =
    'flex-1 flex items-center justify-center text-[9px] leading-none text-gray-300 hover:bg-gray-600 hover:text-white active:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors select-none touch-none [-webkit-touch-callout:none]';
  const tickLabel = base != null ? `呼値 ${formatTick(tick)}円` : undefined;

  return (
    <div className="space-y-1 min-w-0">
      <label htmlFor={id} className={`block truncate ${labelClassName}`}>
        {label}
      </label>
      {/* 3列でも数値が潰れないよう、▲▼は入力欄の右端に縦積みで置く */}
      <div className="flex" title={tickLabel}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          placeholder="0"
          className={`flex-1 min-w-0 px-2 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white text-right placeholder-gray-400 focus:outline-none text-base md:text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${focusClassName}`}
        />
        <div className="shrink-0 w-7 flex flex-col bg-gray-700 border border-l-0 border-gray-600 rounded-r-lg overflow-hidden divide-y divide-gray-600">
          <button
            type="button"
            {...buttonHandlers('up')}
            onBlur={onBlur}
            disabled={base == null}
            aria-label="1呼値上げる"
            className={buttonClass}
          >
            ▲
          </button>
          <button
            type="button"
            {...buttonHandlers('down')}
            onBlur={onBlur}
            disabled={base == null}
            aria-label="1呼値下げる"
            className={buttonClass}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}
