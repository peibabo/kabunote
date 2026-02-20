/**
 * Next Action Plan（次の一手）関連の型定義
 */

export type ActionType = 'buy' | 'sell' | 'hold';
export type Priority = 'high' | 'medium' | 'low';

export interface NextActionPlan {
  targetPrice: number;        // 目標価格
  targetQuantity: number;     // 追加/新規株数
  memo: string;              // 作戦理由・メモ
  actionType: ActionType;    // アクション種別
  priority: Priority;        // 優先度
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

/**
 * Next Action Plan のデフォルト値を生成
 */
export const createDefaultNextActionPlan = (): NextActionPlan => ({
  targetPrice: 0,
  targetQuantity: 0,
  memo: '',
  actionType: 'buy',
  priority: 'medium'
});

/**
 * Next Action Plan の分析を実行
 */
export const analyzeNextActionPlan = (
  plan: NextActionPlan,
  currentPrice: number,
  currentHoldings: {
    totalShares: number;
    totalCost: number;
  } | null = null,
  availableCash?: number
): NextActionPlanAnalysis => {
  const priceGap = plan.targetPrice - currentPrice;
  const gapPercentage = currentPrice > 0 ? (priceGap / currentPrice) * 100 : 0;
  const requiredInvestment = plan.targetPrice * plan.targetQuantity;
  const absGapPercentage = Math.abs(gapPercentage);
  const isApproaching = absGapPercentage <= 2; // 2%以内で接近とみなす
  const isWarning = absGapPercentage > 2 && absGapPercentage <= 5; // 2-5%以内で警告とみなす

  let predictedAveragePrice: number | undefined;

  // 追加購入の場合の予想平均取得単価を計算
  if (currentHoldings && plan.actionType === 'buy') {
    const totalNewCost = currentHoldings.totalCost + requiredInvestment;
    const totalNewShares = currentHoldings.totalShares + plan.targetQuantity;
    predictedAveragePrice = totalNewShares > 0 ? totalNewCost / totalNewShares : 0;
  }

  // 投資余力現金の分析（buyアクションの場合のみ）
  const cashAvailable = availableCash || 0;
  const canExecute = plan.actionType === 'buy' ? cashAvailable >= requiredInvestment : true;
  const cashAfterInvestment = plan.actionType === 'buy' ? Math.max(0, cashAvailable - requiredInvestment) : cashAvailable;

  // 現金比率への影響計算（売却時は逆に現金増加）
  let cashRatioImpact = 0;
  if (availableCash && currentHoldings) {
    const currentTotalAssets = currentHoldings.totalCost + cashAvailable;
    if (currentTotalAssets > 0) {
      const currentCashRatio = (cashAvailable / currentTotalAssets) * 100;
      const newCashRatio = (cashAfterInvestment / currentTotalAssets) * 100;
      cashRatioImpact = newCashRatio - currentCashRatio;
    }
  }

  return {
    currentPrice,
    priceGap,
    gapPercentage,
    requiredInvestment,
    predictedAveragePrice,
    isApproaching,
    isWarning,
    cashAvailable,
    canExecute,
    cashAfterInvestment,
    cashRatioImpact
  };
};