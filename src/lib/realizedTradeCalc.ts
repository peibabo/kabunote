// 確定損益（売却）計算ヘルパー

import { calculateAfterTax } from '@/lib/taxCalc';
import type { ConsumedLot, RealizedTrade, RealizedTradeResult, RealizedTradeSummary } from '@/types/realizedTrade';

/**
 * DBのconsumed_lots(JSON)を ConsumedLot[] に正規化する。
 * 非配列・欠損・不正要素は安全に除去する（後方互換・防御的パース）。
 */
export const parseConsumedLots = (value: unknown): ConsumedLot[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is { shares: number; purchaseDate?: string } =>
      typeof v === 'object' && v !== null && typeof (v as { shares?: unknown }).shares === 'number')
    .map(v => ({ shares: v.shares, purchaseDate: typeof v.purchaseDate === 'string' ? v.purchaseDate : '' }));
};

/**
 * 売却前プレビュー・実現損益を計算する純粋関数。
 * 加重平均法のため、原価は全ロットの平均取得単価（avgCost）を渡す。
 * 利益が出た場合のみ税引後を計算する（損失時は損益通算前提でそのまま）。
 */
export const calculateRealizedTrade = (
  soldShares: number,
  sellPrice: number,
  avgCost: number,
  taxRate: number
): RealizedTradeResult => {
  const gross = (sellPrice - avgCost) * soldShares;
  const afterTax = gross > 0 ? calculateAfterTax(gross, taxRate) : gross;
  const plPercent = avgCost > 0 ? ((sellPrice - avgCost) / avgCost) * 100 : 0;
  const proceeds = sellPrice * soldShares;

  return { gross, afterTax, plPercent, proceeds };
};

/**
 * 消し込んだロットの取得日から、保有銘柄の取得時期を文字列化する。
 * 単一日付は "2024-03-01"、複数なら最古〜最新の期間 "2024-03-01〜2025-01-10"。
 * 取得日が1件も無ければ空文字を返す（表示側で省略）。
 */
export const formatAcquisitionPeriod = (consumedLots: ConsumedLot[]): string => {
  const dates = consumedLots.map(l => l.purchaseDate).filter(d => d.length > 0).sort();
  if (dates.length === 0) return '';
  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  return earliest === latest ? earliest : `${earliest}〜${latest}`;
};

/**
 * 確定損益レコードの集計（銘柄別・年間・全体で共用）。
 * 税引後は各レコードごとに利益のみ課税して合算する。
 */
export const summarizeRealizedTrades = (trades: RealizedTrade[]): RealizedTradeSummary => {
  return trades.reduce<RealizedTradeSummary>(
    (acc, t) => {
      acc.totalGross += t.realizedPL;
      acc.totalAfterTax += t.realizedPL > 0 ? calculateAfterTax(t.realizedPL, t.taxRate) : t.realizedPL;
      if (t.realizedPL > 0) acc.winCount += 1;
      else if (t.realizedPL < 0) acc.lossCount += 1;
      acc.tradeCount += 1;
      return acc;
    },
    { totalGross: 0, totalAfterTax: 0, winCount: 0, lossCount: 0, tradeCount: 0 }
  );
};
