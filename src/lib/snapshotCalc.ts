// ポートフォリオスナップショット計算ロジック

import { calculatePositionSummary } from '@/lib/positionCalc';
import type { Position } from '@/types/positions';

export interface StockInput {
  id: string;
  symbol: string;
  currentPrice: number | null;
  positions: Position[];
}

export interface StockSnapshotInput {
  stockId: string;
  symbol: string;
  currentPrice: number | null;
  shares: number;
  value: number;
  cost: number;
}

export interface SnapshotData {
  totalInvestment: number;
  totalValue: number;
  profitLoss: number;
  cashAmount: number;
  netAssets: number;
  stockSnapshots: StockSnapshotInput[];
}

export function buildSnapshotData(stocks: StockInput[], cashAmount: number): SnapshotData {
  let totalInvestment = 0;
  let totalValue = 0;
  const stockSnapshots: StockSnapshotInput[] = [];

  for (const stock of stocks) {
    const hasPositions = stock.positions.length > 0;
    const summary = hasPositions ? calculatePositionSummary(stock.positions) : null;
    const hasShares = summary != null && summary.totalShares > 0;

    if (hasShares) {
      const price = stock.currentPrice;
      const value = price != null && price > 0
        ? price * summary.totalShares
        : summary.totalCost;

      totalInvestment += summary.totalCost;
      totalValue += value;

      stockSnapshots.push({
        stockId: stock.id,
        symbol: stock.symbol,
        currentPrice: price,
        shares: summary.totalShares,
        value,
        cost: summary.totalCost,
      });
    } else if (stock.currentPrice != null && stock.currentPrice > 0) {
      stockSnapshots.push({
        stockId: stock.id,
        symbol: stock.symbol,
        currentPrice: stock.currentPrice,
        shares: 0,
        value: 0,
        cost: 0,
      });
    }
  }

  const profitLoss = totalValue - totalInvestment;
  const netAssets = totalValue + cashAmount;

  return {
    totalInvestment,
    totalValue,
    profitLoss,
    cashAmount,
    netAssets,
    stockSnapshots,
  };
}

// 保存済みスナップショット行（過去データ修正時の再計算用）
export interface StoredSnapshotRow {
  currentPrice: number | null;
  shares: number;
  cost: number;
}

export interface RecalcResult {
  totalInvestment: number;
  totalValue: number;
  profitLoss: number;
  netAssets: number;
  /** 各行の再計算後の評価額（rows と同じ順序） */
  values: number[];
}

/**
 * 銘柄スナップショット1行の評価額を算出。
 * buildSnapshotData() と同じロジック（保有あり: price>0 なら price×shares、なければ cost。保有なし: 0）。
 */
export function computeStockSnapshotValue(
  currentPrice: number | null,
  shares: number,
  cost: number
): number {
  if (shares > 0) {
    return currentPrice != null && currentPrice > 0 ? currentPrice * shares : cost;
  }
  return 0;
}

/**
 * 保存済みスナップショットの集計値を、各行の currentPrice/shares/cost と現金から再計算する。
 * 過去データ修正（個別株価の上書き）時に使用。現在のポジションには依存しない。
 */
export function recalcSnapshotAggregates(
  rows: StoredSnapshotRow[],
  cashAmount: number
): RecalcResult {
  let totalInvestment = 0;
  let totalValue = 0;
  const values: number[] = [];

  for (const row of rows) {
    const value = computeStockSnapshotValue(row.currentPrice, row.shares, row.cost);
    values.push(value);
    if (row.shares > 0) {
      totalInvestment += row.cost;
      totalValue += value;
    }
  }

  const profitLoss = totalValue - totalInvestment;
  const netAssets = totalValue + cashAmount;

  return { totalInvestment, totalValue, profitLoss, netAssets, values };
}

export const RANGE_DAYS: Record<string, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  '2Y': 730,
};

/**
 * 期間文字列を日数に解決する。未知の期間は fallback を返す。
 *
 * `RANGE_DAYS[range] ?? fallback` と書いてはいけない。素のオブジェクトなので
 * `?range=__proto__` や `constructor` で `Object.prototype` 等が返り、`??` に
 * 捕まらないまま「日数が数値でない」値が通る。日付フィルタが外れて
 * 全期間をスキャンしてしまうため、必ず自前プロパティだけを見る。
 */
export function resolveRangeDays(range: string, fallback: number): number {
  return Object.prototype.hasOwnProperty.call(RANGE_DAYS, range)
    ? RANGE_DAYS[range]
    : fallback;
}
