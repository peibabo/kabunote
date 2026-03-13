/**
 * Next Action Plan（次の一手）関連の型定義
 */

export type ActionType = 'buy' | 'sell' | 'hold';
export type Priority = 'high' | 'medium' | 'low';

export interface NextActionPlan {
  id: string;                // ID
  targetPrice: number | null; // 目標価格
  targetQuantity: number | null; // 追加/新規株数
  memo: string;              // 作戦理由・メモ
  actionType: ActionType;    // アクション種別
  priority: Priority;        // 優先度
  updatedAt: string;         // 更新日時
}

/**
 * Next Action Plan の分析情報
 */
export interface NextActionPlanAnalysis {
  currentPrice: number;           // 現在価格
  priceGap: number;              // 価格差（目標価格 - 現在価格）
  gapPercentage: number;         // 乖離率（%）
  requiredInvestment: number;    // 必要投資額
  predictedAveragePrice?: number; // 予想平均取得単価（追加購入の場合）
  isApproaching: boolean;        // 目標価格に接近中か（乖離率2%以内）
  isWarning: boolean;           // 目標価格に注意段階か（乖離率2-5%以内）

  // 投資余力関連の分析情報
  cashAvailable: number;         // 利用可能現金
  canExecute: boolean;          // 実行可能か
  cashAfterInvestment: number;  // 投資後現金残高
  cashRatioImpact: number;      // 現金比率への影響(%)
}
