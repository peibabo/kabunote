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
