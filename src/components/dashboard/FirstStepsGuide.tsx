'use client';

import { useState } from 'react';
import { calcFirstSteps, type FirstStepId } from '@/lib/firstStepsCalc';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents';
import { playSound } from '@/lib/sound';
import { grantXp } from '@/lib/gamification';
import {
  switchCardTab,
  switchToPriceInput,
  focusPriceInput,
  CARD_TAB_SWITCH_DELAY_MS,
  type CardManagementTab,
} from '@/lib/stockCardNav';
import { useAppEvent } from '@/hooks/util/useAppEvent';
import type { StockData } from '@/types/stock';

interface FirstStepsGuideProps {
  /** 表示順（stockSymbols 順）に並べた銘柄データ */
  stocks: Pick<StockData, 'symbol' | 'name' | 'memo' | 'positions' | 'currentPrice'>[];
  hasCalendarData: boolean;
  /** ポートフォリオの記録（スナップショット）が過去に1件以上あるか */
  hasSnapshot: boolean;
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
  'record-price': {
    icon: '📸',
    title: '今日の株価を入れて記録',
    description:
      '株価は自動では更新されません。保有株の今日の株価を入れて「記録」すると、その日の評価額が残ります（同じ日に押し直すと上書き）。毎日続けると資産推移グラフが伸びていきます',
  },
  'add-second-stock': {
    icon: '🔍',
    title: '気になる銘柄をもう1つ追加',
    description: '比べられると、思考の整理がぐっと楽になります',
  },
};

export default function FirstStepsGuide({
  stocks,
  hasCalendarData,
  hasSnapshot,
  onStockClick,
  onOpenAddStock,
}: FirstStepsGuideProps) {
  const [isDismissed, setIsDismissed] = useState(
    () => safeGetItem(STORAGE_KEYS.FIRST_STEPS_DISMISSED) === '1'
  );
  // 一覧データ（hasSnapshot）は再取得されないため、このセッションでの記録はイベントで反映する
  const [recordedInSession, setRecordedInSession] = useState(false);
  // 記録した直後だけ「明日も記録しよう」を出す（全ステップ完了でガイドが消える場合も含む）
  const [justRecorded, setJustRecorded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, () => setRecordedInSession(true));

  const progress = calcFirstSteps(stocks, hasCalendarData, hasSnapshot || recordedInSession);

  if (isDismissed || !progress.targetSymbol) return null;

  if (progress.isAllDone) {
    if (!justRecorded) return null;
    return (
      <section
        aria-label="はじめの一歩"
        role="status"
        className="relative bg-gray-800 border border-green-700/60 rounded-lg p-4 mb-4"
      >
        <button
          onClick={() => setJustRecorded(false)}
          className="cursor-pointer absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="閉じる"
          title="閉じる"
        >
          ✕
        </button>
        <p className="pr-8 text-sm text-white font-medium">✅ 今日の記録ができました！</p>
        <p className="pr-8 text-xs text-gray-400 mt-1">
          明日も株価を入れて記録すると、ポートフォリオ推移グラフに線が伸びていきます。記録し忘れた日も、推移グラフから後で追加できます。
        </p>
      </section>
    );
  }

  const target = progress.targetSymbol;
  // 他のステップを終えた既存ユーザーに記録ステップだけ再表示される場合は、導入ではなく毎日の使い方として案内する
  const onlyRecordLeft = progress.steps.every(s => s.done || s.id === 'record-price');
  const targetName = stocks.find(s => s.symbol === target)?.name || target;

  const goToCard = (mainTab: 'basic' | 'management', subTab?: CardManagementTab) => {
    playSound('toggle');
    switchCardTab(target, mainTab, subTab);
    // タブ切り替えの描画を待ってからスクロール
    setTimeout(() => {
      onStockClick(target);
      if (mainTab === 'basic') {
        const memoInput = document.getElementById(`memo-${target}`);
        memoInput?.focus({ preventScroll: true });
      }
    }, CARD_TAB_SWITCH_DELAY_MS);
  };

  const goToPriceInput = (symbol: string) => {
    playSound('toggle');
    switchToPriceInput(symbol);
    setTimeout(() => {
      onStockClick(symbol);
      focusPriceInput(symbol, { preventScroll: true });
    }, CARD_TAB_SWITCH_DELAY_MS);
  };

  const handleRecord = async () => {
    setIsRecording(true);
    setRecordError(null);
    try {
      const res = await fetch('/api/portfolio/snapshot', { method: 'POST' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || '記録に失敗しました');
      }
      playSound('noteSave');
      grantXp('PORTFOLIO_SNAPSHOT');
      setJustRecorded(true);
      setRecordedInSession(true);
      emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED);
    } catch (e) {
      setRecordError(e instanceof Error ? e.message : '記録に失敗しました');
    } finally {
      setIsRecording(false);
    }
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
      case 'record-price': {
        // 未入力の保有銘柄があればそこへ。全て入力済みでも古い株価のまま記録しないよう「更新」導線を残す
        const missingSymbol = progress.priceInputSymbol;
        const priceSymbol = missingSymbol ?? progress.heldSymbol;
        const priceName = priceSymbol ? stocks.find(s => s.symbol === priceSymbol)?.name || priceSymbol : '';
        return (
          <div className="flex flex-wrap gap-2">
            {priceSymbol && (
              <button
                className={missingSymbol ? primary : secondary}
                onClick={() => goToPriceInput(priceSymbol)}
                title={`${priceName} の現在の株価を${missingSymbol ? '入力' : '更新'}`}
              >
                {missingSymbol ? '株価を入力' : '株価を更新'}
              </button>
            )}
            {progress.canRecord && (
              <button
                className={`${missingSymbol ? secondary : primary} disabled:opacity-50 disabled:cursor-not-allowed`}
                onClick={handleRecord}
                disabled={isRecording}
              >
                {isRecording ? '記録中...' : '📸 今日の記録をする'}
              </button>
            )}
          </div>
        );
      }
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
        {onlyRecordLeft ? (
          <p className="text-xs text-gray-400 mt-1">
            あと1つ！カブノオトは <span className="text-blue-300 font-medium">毎日株価を入れて記録する</span> と、資産の推移が見えてきます
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            まずは <span className="text-blue-300 font-medium">{targetName}</span> で、カブノオトの使い方を試してみましょう
          </p>
        )}
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

      {justRecorded && (
        <p className="mt-3 text-xs text-green-400" role="status">
          ✅ 今日の記録ができました！明日も株価を入れて記録すると、推移グラフに線が伸びていきます。記録し忘れた日も後で追加できます。
        </p>
      )}

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
                  {!step.done && step.id === 'record-price' && recordError && (
                    <p className="text-xs text-red-400 mt-0.5" role="alert">{recordError}</p>
                  )}
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
