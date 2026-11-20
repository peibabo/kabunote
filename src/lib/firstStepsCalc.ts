/**
 * 「はじめの一歩」ガイドの進捗計算
 *
 * 銘柄を1つ追加しただけで離脱するユーザーが多いため、
 * 追加直後に「次にやること」を具体的なアクション付きで提示する。
 *
 * 株価は自動更新されないため、保有株を登録したユーザーには
 * 「今日の株価を入れて記録する」という毎日の使い方も案内する。
 */

import type { StockData } from '@/types/stock';

export type FirstStepId =
  | 'add-stock'
  | 'write-memo'
  | 'register-position'
  | 'record-price'
  | 'add-second-stock';

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
  /** 現在株価が未入力の保有銘柄（先頭。全て入力済み or 保有なしなら null） */
  priceInputSymbol: string | null;
  /** 先頭の保有銘柄（株価の更新先。保有なしなら null） */
  heldSymbol: string | null;
  /** 現在株価が入った保有銘柄が1つ以上あり、今日の記録（スナップショット）を作成できる */
  canRecord: boolean;
}

type StepSource = Pick<StockData, 'symbol' | 'memo' | 'positions' | 'currentPrice'>;

const hasMemo = (stock: StepSource) => (stock.memo ?? '').trim().length > 0;
const holdsShares = (stock: StepSource) => (stock.positions ?? []).some(p => p.shares > 0);
const hasPrice = (stock: StepSource) => stock.currentPrice != null && stock.currentPrice > 0;

/**
 * @param hasSnapshot ポートフォリオの記録（スナップショット）が過去に1件以上あるか
 */
export function calcFirstSteps(
  stocks: StepSource[],
  hasCalendarData: boolean,
  hasSnapshot = false
): FirstStepsProgress {
  const stockCount = stocks.length;
  const anyMemo = stocks.some(hasMemo);
  const anyPosition = stocks.some(s => (s.positions?.length ?? 0) > 0);
  const heldStocks = stocks.filter(holdsShares);

  const steps: FirstStep[] = [
    { id: 'add-stock', done: stockCount > 0 },
    { id: 'write-memo', done: anyMemo },
    // 保有していない人もいるので、決算日などの予定登録でも達成扱い
    { id: 'register-position', done: anyPosition || hasCalendarData },
    // 株価の記録は保有株がある人だけに案内する（未保有の人には記録対象がない）
    ...(heldStocks.length > 0 ? [{ id: 'record-price' as const, done: hasSnapshot }] : []),
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
    heldSymbol: heldStocks[0]?.symbol ?? null,
    priceInputSymbol: heldStocks.find(s => !hasPrice(s))?.symbol ?? null,
    canRecord: heldStocks.some(hasPrice),
  };
}
