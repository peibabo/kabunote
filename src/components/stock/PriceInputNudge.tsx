'use client';

import { useState } from 'react';
import { playSound } from '@/lib/sound';
import { stockKey } from '@/lib/storageKeys';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import {
  switchToPriceInput,
  focusPriceInput,
  CARD_TAB_SWITCH_DELAY_MS,
} from '@/lib/stockCardNav';

interface PriceInputNudgeProps {
  symbol: string;
}

/** 保有株がある・現在株価が未入力・株価欄のある分析タブを開いていない、のときだけ案内する */
export function shouldShowPriceNudge(totalShares: number, currentPrice: string, activeTab: string): boolean {
  return totalShares > 0 && !(parseFloat(currentPrice) > 0) && activeTab !== 'analysis';
}

/**
 * 保有株があるのに現在株価が未入力の銘柄カードに出す案内
 *
 * 株価は自動更新されないため、入力しないと損益も毎日の記録も出せないことを伝える。
 */
export default function PriceInputNudge({ symbol }: PriceInputNudgeProps) {
  // 株価をあえて入れない人のノイズにならないよう、銘柄ごとに閉じられる
  const [isDismissed, setIsDismissed] = useState(
    () => safeGetItem(stockKey.priceNudgeDismissed(symbol)) === '1'
  );

  const handleClick = () => {
    playSound('toggle');
    switchToPriceInput(symbol);
    setTimeout(() => focusPriceInput(symbol), CARD_TAB_SWITCH_DELAY_MS);
  };

  const handleDismiss = () => {
    safeSetItem(stockKey.priceNudgeDismissed(symbol), '1');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div
      className="relative flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg pr-8 border border-blue-600/50 bg-blue-900/30 px-3 py-2"
      data-testid={`price-input-nudge-${symbol}`}
    >
      <p className="flex-1 text-xs text-blue-100 leading-relaxed">
        💡 現在の株価が未入力です。株価は自動で更新されないので、今日の株価を入れると損益が表示され、毎日の記録にも使われます。
      </p>
      <button
        type="button"
        onClick={handleClick}
        className="cursor-pointer self-start sm:self-auto shrink-0 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors whitespace-nowrap"
      >
        株価を入力
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="cursor-pointer absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-xs text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        aria-label="株価未入力の案内を閉じる"
        title="閉じる"
      >
        ✕
      </button>
    </div>
  );
}
