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
    if (stock.positions.length === 0) continue;

    const summary = calculatePositionSummary(stock.positions);
    if (summary.totalShares === 0) continue;

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

export const RANGE_DAYS: Record<string, number> = {
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  'ALL': 0,
};
