/**
 * 銘柄データの型定義
 */

import type { Position } from '@/types/positions';

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
  // インラインで再定義せず Position を使う（useStockPosition が Position[] を流すため）
  positions: Position[];
  events: Array<{
    id: string;
    eventType: string;
    eventDate: string | null;
    eventMonth: number | null;
    eventDay: number | null;
    isRecurring: boolean;
    isActive: boolean;
  }>;
  // 配当・優待は「レコードはあるが個別項目は未入力」を許すため各項目が null になりうる
  // （API・フォーム双方が null を返す。消費側も従来から `!= null` でガードしている）
  dividend: {
    dividendPerShare: number | null;
    frequency: number;
    rightsMonth: number | null;
    rightsDay: number | null;
  } | null;
  benefit: {
    description: string | null;
    minimumShares: number | null;
    estimatedValue: number | null;
    rightsMonth: number | null;
    rightsDay: number | null;
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
