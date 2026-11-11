/**
 * 「はじめの一歩」ガイドの進捗計算
 *
 * 銘柄を1つ追加しただけで離脱するユーザーが多いため、
 * 追加直後に「次にやること」を具体的なアクション付きで提示する。
 */

import type { StockData } from '@/types/stock';

export type FirstStepId = 'add-stock' | 'write-memo' | 'register-position' | 'add-second-stock';

export interface FirstStep {
  id: FirstStepId;
  done: boolean;
}

export interface FirstStepsProgress {
  steps: FirstStep[];
  completedCount: number;
  totalCount: number;
  isAllDone: boolean;
  /** 次に取り組むべきステップ（全完了なら null） */
  nextStepId: FirstStepId | null;
  /** メモ・保有登録の案内先となる銘柄（銘柄が無ければ null） */
  targetSymbol: string | null;
}

type StepSource = Pick<StockData, 'symbol' | 'memo' | 'positions'>;

const hasMemo = (stock: StepSource) => (stock.memo ?? '').trim().length > 0;

export function calcFirstSteps(
  stocks: StepSource[],
  hasCalendarData: boolean
): FirstStepsProgress {
  const stockCount = stocks.length;
  const anyMemo = stocks.some(hasMemo);
  const anyPosition = stocks.some(s => (s.positions?.length ?? 0) > 0);

  const steps: FirstStep[] = [
    { id: 'add-stock', done: stockCount > 0 },
    { id: 'write-memo', done: anyMemo },
    // 保有していない人もいるので、決算日などの予定登録でも達成扱い
    { id: 'register-position', done: anyPosition || hasCalendarData },
    { id: 'add-second-stock', done: stockCount >= 2 },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const nextStep = steps.find(s => !s.done);

  return {
    steps,
    completedCount,
    totalCount: steps.length,
    isAllDone: completedCount === steps.length,
    nextStepId: nextStep?.id ?? null,
    // 案内先は先頭（画面上で一番上）の銘柄カード
    targetSymbol: stocks[0]?.symbol ?? null,
  };
}
