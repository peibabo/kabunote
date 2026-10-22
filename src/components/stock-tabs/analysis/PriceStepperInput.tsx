'use client';

import type { KeyboardEvent, ReactNode } from 'react';
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

const formatTick = (tick: number) => tick.toLocaleString();

/**
 * 呼値単位で上下できる価格入力欄
 * スマホでは number input のスピンボタンが出ないため、自前の ▲▼ ボタンを置く
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
  const parsed = parseFloat(value);
  const fallback = parseFloat(fallbackBase ?? '');
  const base = parsed > 0 ? parsed : fallback > 0 ? fallback : null;
  const tick = getTickSize(base ?? 0, isTopix500);

  const step = (direction: 'up' | 'down') => {
    if (base == null) return;
    // 未入力で起点価格を使う場合は、まず起点価格そのものを入れる
    if (!(parsed > 0)) {
      onChange(String(base));
      return;
    }
    const next = direction === 'up' ? stepPriceUp(base, isTopix500) : stepPriceDown(base, isTopix500);
    onChange(String(next));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    step(e.key === 'ArrowUp' ? 'up' : 'down');
  };

  const buttonClass =
    'flex-1 flex items-center justify-center text-[9px] leading-none text-gray-300 hover:bg-gray-600 hover:text-white active:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors';
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
            onClick={() => step('up')}
            onBlur={onBlur}
            disabled={base == null}
            aria-label="1呼値上げる"
            className={buttonClass}
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => step('down')}
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
