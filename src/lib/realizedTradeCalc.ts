// 確定損益（売却）計算ヘルパー

import { calculateAfterTax } from '@/lib/taxCalc';
import type { RealizedTrade, RealizedTradeResult, RealizedTradeSummary } from '@/types/realizedTrade';

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
