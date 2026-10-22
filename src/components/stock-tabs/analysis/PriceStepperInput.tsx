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
 * スマホでは number input のスピンボタンが出ないため、自前の −/＋ ボタンを置く
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
    'shrink-0 w-9 bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white active:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors';

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        {base != null && (
          <span className="text-[10px] text-gray-500">呼値 {formatTick(tick)}円</span>
        )}
      </div>
      <div className="flex">
        <button
          type="button"
          onClick={() => step('down')}
          onBlur={onBlur}
          disabled={base == null}
          aria-label="1呼値下げる"
          className={`${buttonClass} rounded-l-lg border-r-0`}
        >
          −
        </button>
        <div className="relative flex-1 min-w-0">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onBlur}
            placeholder="0"
            className={`w-full px-2 py-2 bg-gray-700 border border-gray-600 text-white text-center placeholder-gray-400 focus:outline-none text-base md:text-sm pr-7 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${focusClassName}`}
          />
          <span className="absolute right-2 top-2 text-xs text-gray-400 pointer-events-none">円</span>
        </div>
        <button
          type="button"
          onClick={() => step('up')}
          onBlur={onBlur}
          disabled={base == null}
          aria-label="1呼値上げる"
          className={`${buttonClass} rounded-r-lg border-l-0`}
        >
          ＋
        </button>
      </div>
    </div>
  );
}
