/**
 * 銘柄データの型定義
 */

export interface StockData {
  id: string;
  symbol: string;
  name: string;
  sector: string | null;
  market: string | null;
  order: number;
  currentPrice: number | null;
  targetPrice: number | null;
  stopLossPrice: number | null;
  per: number | null;
  pbr: number | null;
  fairPer: number | null;
  fairPbr: number | null;
  memo: string;
  positions: Array<{
    id: string;
    shares: number;
    purchasePrice: number;
    purchaseDate: string;
    memo: string;
    taxRate: number;
    createdAt: string;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    eventDate: string | null;
    eventMonth: number | null;
    eventDay: number | null;
    isRecurring: boolean;
    isActive: boolean;
  }>;
  dividend: {
    dividendPerShare: number;
    frequency: number;
    rightsMonth: number;
    rightsDay: number;
  } | null;
  benefit: {
    description: string;
    minimumShares: number;
    estimatedValue: number;
    rightsMonth: number;
    rightsDay: number;
  } | null;
  tags: Array<{
    id: string;
    label: string;
    color: string;
    createdAt: string;
  }>;
  nextActionPlan: {
    actionType: string;
    priority: string;
    targetPrice: number | null;
    targetShares: number | null;
    strategyMemo: string;
  } | null;
  newsItems?: Array<{
    id: string;
    url: string;
    comment: string;
  }>;
  snapshotPrice: number | null;
  snapshotDate: string | null;
  snapshotValue: number | null;
  snapshotCost: number | null;
  createdAt: string;
  updatedAt: string;
}
