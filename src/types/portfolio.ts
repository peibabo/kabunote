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
  stockId: string;
  symbol: string;
  currentPrice: number | null;
  shares: number;
  value: number;
  cost: number;
}

// 期間選択の選択肢（型・パーサー・UIの単一情報源）
export const HISTORY_RANGES = ['1W', '1M', '3M', '6M', '1Y', '2Y'] as const;

export type HistoryRange = (typeof HISTORY_RANGES)[number];

/** localStorage等の文字列を有効な HistoryRange に復元する。不正値は fallback を返す */
export function parseHistoryRange(value: string, fallback: HistoryRange): HistoryRange {
  return (HISTORY_RANGES as readonly string[]).includes(value)
    ? (value as HistoryRange)
    : fallback;
}

export type ChartType = 'value' | 'netAssets' | 'profitLoss' | 'stocks';

// チャート種別のラベル・アイコン（タブ表示・メモモーダル共通の単一情報源）
// 並び順はタブ表示順を兼ねる
export const CHART_TYPE_META: Record<ChartType, { label: string; icon: string }> = {
  value: { label: '評価額', icon: '💰' },
  netAssets: { label: '純資産', icon: '🏦' },
  profitLoss: { label: '損益', icon: '📈' },
  stocks: { label: '個別株価', icon: '📊' },
};

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

// チャートメモ一覧関連
export type ChartMemoFilter = 'all' | ChartType;

export interface ChartMemoListItem extends ChartMemoData {
  stockName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChartMemoListResponse {
  items: ChartMemoListItem[];
  total: number;
}
