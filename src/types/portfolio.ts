// ポートフォリオスナップショット関連の型定義

export interface PortfolioSnapshotData {
  id: string;
  snapshotDate: string;
  totalInvestment: number;
  totalValue: number;
  profitLoss: number;
  cashAmount: number;
  netAssets: number;
  stockSnapshots: StockSnapshotData[];
}

export interface StockSnapshotData {
  symbol: string;
  currentPrice: number | null;
  shares: number;
  value: number;
  cost: number;
}

export type HistoryRange = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type ChartType = 'value' | 'netAssets' | 'profitLoss' | 'stocks';

// チャートメモ関連
export interface ChartMemoData {
  id: string;
  snapshotDate: string;  // YYYY-MM-DD
  chartType: ChartType;
  symbol: string;
  content: string;
}

export type ChartMemoMap = Map<string, ChartMemoData>;

export function chartMemoKey(date: string, chartType: ChartType, symbol?: string): string {
  return `${date}|${chartType}|${symbol || ''}`;
}

export const VALID_CHART_TYPES: ChartType[] = ['value', 'netAssets', 'profitLoss', 'stocks'];
