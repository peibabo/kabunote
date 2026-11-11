'use client';

import { useState } from 'react';
import { calcFirstSteps, type FirstStepId } from '@/lib/firstStepsCalc';
import { STORAGE_KEYS, stockKey } from '@/lib/storageKeys';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents';
import { playSound } from '@/lib/sound';
import type { StockData } from '@/types/stock';

interface FirstStepsGuideProps {
  /** 表示順（stockSymbols 順）に並べた銘柄データ */
  stocks: Pick<StockData, 'symbol' | 'name' | 'memo' | 'positions'>[];
  hasCalendarData: boolean;
  /** 銘柄カードへスクロールしてハイライトする */
  onStockClick: (symbol: string) => void;
  /** 銘柄追加ダイアログを開く */
  onOpenAddStock: () => void;
}

const STEP_LABELS: Record<FirstStepId, { icon: string; title: string; description: string }> = {
  'add-stock': {
    icon: '➕',
    title: '気になる銘柄を追加',
    description: '銘柄カードができました',
  },
  'write-memo': {
    icon: '📝',
    title: '「なぜ気になったか」を1行メモ',
    description: '買う理由・見ている理由を残すと、後で判断を振り返れます',
  },
  'register-position': {
    icon: '💼',
    title: '保有株を登録（未保有なら決算日）',
    description: '損益や投資カレンダーが自動で表示されます',
  },
  'add-second-stock': {
    icon: '🔍',
    title: '気になる銘柄をもう1つ追加',
    description: '比べられると、思考の整理がぐっと楽になります',
  },
};

/** 銘柄カードのタブを外部から切り替える（BulkTabSwitcher と同じ仕組み） */
function switchCardTab(symbol: string, mainTab: 'basic' | 'management', managementSubTab?: 'positions' | 'events') {
  safeSetItem(stockKey.activeTab(symbol), mainTab);
  emitAppEvent(APP_EVENTS.LOCAL_STORAGE_CHANGE, { key: stockKey.activeTab(symbol) });
  if (managementSubTab) {
    safeSetItem(stockKey.managementTab(symbol), managementSubTab);
    emitAppEvent(APP_EVENTS.LOCAL_STORAGE_CHANGE, { key: stockKey.managementTab(symbol) });
  }
}

export default function FirstStepsGuide({
  stocks,
  hasCalendarData,
  onStockClick,
  onOpenAddStock,
}: FirstStepsGuideProps) {
  const [isDismissed, setIsDismissed] = useState(
    () => safeGetItem(STORAGE_KEYS.FIRST_STEPS_DISMISSED) === '1'
  );

  const progress = calcFirstSteps(stocks, hasCalendarData);

  if (isDismissed || progress.isAllDone || !progress.targetSymbol) return null;

  const target = progress.targetSymbol;
  const targetName = stocks.find(s => s.symbol === target)?.name || target;

  const goToCard = (mainTab: 'basic' | 'management', subTab?: 'positions' | 'events') => {
    playSound('toggle');
    switchCardTab(target, mainTab, subTab);
    // タブ切り替えの描画を待ってからスクロール
    setTimeout(() => {
      onStockClick(target);
      if (mainTab === 'basic') {
        const memoInput = document.getElementById(`memo-${target}`);
        memoInput?.focus({ preventScroll: true });
      }
    }, 150);
  };

  const handleDismiss = () => {
    safeSetItem(STORAGE_KEYS.FIRST_STEPS_DISMISSED, '1');
    setIsDismissed(true);
  };

  const renderAction = (id: FirstStepId) => {
    const primary =
      'cursor-pointer text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors whitespace-nowrap';
    const secondary =
      'cursor-pointer text-sm px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors whitespace-nowrap';
    switch (id) {
      case 'write-memo':
        return (
          <button className={primary} onClick={() => goToCard('basic')}>
            メモを書く
          </button>
        );
      case 'register-position':
        return (
          <div className="flex flex-wrap gap-2">
            <button className={primary} onClick={() => goToCard('management', 'positions')}>
              保有株を登録
            </button>
            <button className={secondary} onClick={() => goToCard('management', 'events')}>
              決算日を登録
            </button>
          </div>
        );
      case 'add-second-stock':
        return (
          <button
            className={primary}
            onClick={() => {
              playSound('toggle');
              onOpenAddStock();
            }}
          >
            銘柄を追加
          </button>
        );
      default:
        return null;
    }
  };

  const percent = Math.round((progress.completedCount / progress.totalCount) * 100);

  return (
    <section
      aria-label="はじめの一歩"
      className="relative bg-gray-800 border border-blue-700/60 rounded-lg p-4 mb-4"
    >
      <button
        onClick={handleDismiss}
        className="cursor-pointer absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
        aria-label="ガイドを閉じる"
        title="ガイドを閉じる"
      >
        ✕
      </button>

      <div className="pr-8">
        <h3 className="text-base font-semibold text-white">🚀 はじめの一歩</h3>
        <p className="text-xs text-gray-400 mt-1">
          まずは <span className="text-blue-300 font-medium">{targetName}</span> で、カブノオトの使い方を試してみましょう
        </p>
      </div>

      <div className="flex items-center gap-3 mt-3">
        <div
          className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={progress.totalCount}
          aria-valuenow={progress.completedCount}
        >
          <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
        <span className="text-xs text-gray-300 tabular-nums whitespace-nowrap">
          {progress.completedCount} / {progress.totalCount} 完了
        </span>
      </div>

      <ol className="mt-3 space-y-2">
        {progress.steps.map(step => {
          const label = STEP_LABELS[step.id];
          const isNext = step.id === progress.nextStepId;
          return (
            <li
              key={step.id}
              data-step={step.id}
              data-done={step.done}
              className={`flex flex-col sm:flex-row sm:items-center gap-2 rounded-md px-3 py-2 ${
                isNext ? 'bg-blue-900/40 border border-blue-600/60' : 'bg-gray-900/40'
              }`}
            >
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <span
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-xs ${
                    step.done ? 'bg-green-600 text-white' : 'border border-gray-500 text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <div className="min-w-0">
                  <p className={`text-sm ${step.done ? 'text-gray-500 line-through' : 'text-white font-medium'}`}>
                    {label.icon} {label.title}
                    <span className="sr-only">{step.done ? '（完了）' : '（未完了）'}</span>
                  </p>
                  {!step.done && <p className="text-xs text-gray-400 mt-0.5">{label.description}</p>}
                </div>
              </div>
              {!step.done && <div className="pl-7 sm:pl-0">{renderAction(step.id)}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
