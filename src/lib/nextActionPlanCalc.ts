// Next Action Plan 関連の計算ユーティリティ

import type { NextActionPlan, NextActionPlanAnalysis } from '@/types/nextActionPlan';

/**
 * Next Action Plan のデフォルト値を生成
 */
export const createDefaultNextActionPlan = (): NextActionPlan => ({
  id: 'local',
  targetPrice: null,
  targetQuantity: null,
  memo: '',
  actionType: 'buy',
  priority: 'medium',
  updatedAt: new Date().toISOString()
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
  const priceGap = (plan.targetPrice || 0) - currentPrice;
  const gapPercentage = currentPrice > 0 ? (priceGap / currentPrice) * 100 : 0;
  const requiredInvestment = (plan.targetPrice || 0) * (plan.targetQuantity || 0);
  const absGapPercentage = Math.abs(gapPercentage);
  const isApproaching = absGapPercentage <= 2; // 2%以内で接近とみなす
  const isWarning = absGapPercentage > 2 && absGapPercentage <= 5; // 2-5%以内で警告とみなす

  let predictedAveragePrice: number | undefined;

  // 追加購入の場合の予想平均取得単価を計算
  if (currentHoldings && plan.actionType === 'buy') {
    const totalNewCost = currentHoldings.totalCost + requiredInvestment;
    const totalNewShares = currentHoldings.totalShares + (plan.targetQuantity || 0);
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

/**
 * Next Action Planが設定されているかチェック
 */
export const hasNextActionPlan = (plan: NextActionPlan): boolean => {
  return plan.targetPrice !== null ||
         plan.targetQuantity !== null ||
         plan.memo.trim() !== '' ||
         plan.actionType !== 'buy' ||
         plan.priority !== 'medium';
};

/**
 * Next Action Planが完全に設定されているかチェック
 */
export const isCompleteNextActionPlan = (plan: NextActionPlan): boolean => {
  return plan.targetPrice !== null &&
         plan.targetQuantity !== null;
};
