// 記録し忘れた日のスナップショット後追加用ロジック（純粋関数）

import { formatDateJST } from '@/lib/dateJst';
import { isTSEBusinessDayStr } from '@/lib/jpBusinessDay';
import type { Position } from '@/types/positions';
import type { ConsumedLot } from '@/types/realizedTrade';

/** 後追加の計算に使う売却記録（realized_trades の必要な列だけ） */
export interface BackfillTradeInput {
  id: string;
  sellDate: string;      // YYYY-MM-DD（JST）
  costBasis: number;     // 売却時点の加重平均取得単価
  taxRate: number;
  consumedLots: ConsumedLot[];
}

/** 後追加できる最も古い日（スナップショットの保持期間と揃える） */
export const BACKFILL_MAX_DAYS = 730;
/** 未記録日として知らせる期間（日数） */
export const MISSING_LOOKBACK_DAYS = 30;

/** YYYY-MM-DD に n 日足す（タイムゾーンに依存しない） */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00.000Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** ポジションの実効取得日。取得日が未設定なら登録日（JST）で代用する */
function effectiveAcquiredDate(p: Position): string {
  if (p.purchaseDate) return p.purchaseDate;
  return p.createdAt ? formatDateJST(new Date(p.createdAt)) : '';
}

/**
 * 指定日（JST, YYYY-MM-DD）の終わりに保有していたロットを再現する。
 *
 * - 今のポジションのうち、取得日がその日以前のもの
 * - ＋ その日より後に売却したロット（consumedLots）のうち、取得日がその日以前のもの
 *   （取得日が空のロットは、いつ買ったか分からないため保有していた扱いにする）
 *
 * 売却したロットの元の取得単価は残っていないため、売却時点の加重平均（costBasis）で近似する。
 */
export function reconstructPositionsAt(
  date: string,
  positions: Position[],
  trades: BackfillTradeInput[],
): Position[] {
  const held = positions.filter(p => {
    const acquired = effectiveAcquiredDate(p);
    return acquired === '' || acquired <= date;
  });

  const restored: Position[] = [];
  for (const trade of trades) {
    if (!(trade.sellDate > date)) continue;
    trade.consumedLots.forEach((lot, i) => {
      if (lot.shares <= 0) return;
      if (lot.purchaseDate && lot.purchaseDate > date) return;
      restored.push({
        id: `restored-${trade.id}-${i}`,
        shares: lot.shares,
        purchasePrice: trade.costBasis,
        purchaseDate: lot.purchaseDate,
        taxRate: trade.taxRate,
        createdAt: '',
      });
    });
  }

  return [...held, ...restored];
}

/**
 * 記録していない東証営業日を新しい順で返す。
 * 対象は max(初回記録日, 今日 - lookbackDays) 〜 昨日。今日は既存の「本日の終値を確定」で記録する。
 * 記録が1件もない（firstRecordedDate が null）なら、使い始める前なので空配列。
 */
export function findMissingBusinessDays(
  recordedDates: Iterable<string>,
  firstRecordedDate: string | null,
  today: string,
  lookbackDays: number = MISSING_LOOKBACK_DAYS,
): string[] {
  if (!firstRecordedDate) return [];
  const recorded = new Set(recordedDates);
  const lookbackStart = addDaysToDateStr(today, -lookbackDays);
  const start = firstRecordedDate > lookbackStart ? firstRecordedDate : lookbackStart;

  const result: string[] = [];
  for (let d = addDaysToDateStr(today, -1); d >= start; d = addDaysToDateStr(d, -1)) {
    if (!recorded.has(d) && isTSEBusinessDayStr(d)) result.push(d);
  }
  return result;
}

export type BackfillDateError =
  | 'invalid'
  | 'not-past'
  | 'too-old'
  | 'holiday';

/** 後追加する日付のチェック（記録済みかどうかは DB を見る必要があるため呼び出し側で確認する） */
export function validateBackfillDate(date: unknown, today: string): BackfillDateError | null {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'invalid';
  // 2026-02-30 のような存在しない日付を弾く
  if (addDaysToDateStr(date, 0) !== date) return 'invalid';
  if (date >= today) return 'not-past';
  if (date < addDaysToDateStr(today, -BACKFILL_MAX_DAYS)) return 'too-old';
  if (!isTSEBusinessDayStr(date)) return 'holiday';
  return null;
}

export const BACKFILL_DATE_ERROR_MESSAGES: Record<BackfillDateError, string> = {
  invalid: '日付の形式が正しくありません',
  'not-past': '後から追加できるのは昨日以前の日です。今日の分は「本日の終値を確定」から記録してください',
  'too-old': '2年より前の日は追加できません',
  holiday: '東証の休業日は記録できません',
};
