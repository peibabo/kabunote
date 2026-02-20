import { NextActionPlan, analyzeNextActionPlan } from '@/types/nextActionPlan';
import { PositionSummary } from '@/types/positions';

/**
 * アラートの閾値設定
 */
export const ALERT_THRESHOLDS = {
  NEXT_ACTION_APPROACHING: 2, // 2%以内で緊急
  NEXT_ACTION_WARNING: 5,     // 2-5%で警告
  STOP_LOSS_APPROACHING: 5,   // 5%以内で損切り警告
  TARGET_PROFIT_APPROACHING: 5 // 5%以内で利確警告
} as const;

/**
 * アラートタイプの定義
 */
export type AlertType =
  | 'nextaction-approaching'
  | 'nextaction-warning'
  | 'stop-loss'
  | 'stop-loss-exceeded'
  | 'target-profit'
  | 'insufficient-funds'
  | 'none';

/**
 * アラート情報の型定義
 */
export interface AlertInfo {
  type: AlertType;
  gapPercentage?: number;
  analysis?: any;
  targetPrice?: number;
  stopLossPrice?: number;
}

/**
 * 価格と目標値の乖離率を計算
 */
export const calculateGapPercentage = (currentPrice: number, targetPrice: number): number => {
  if (currentPrice <= 0 || targetPrice <= 0) return Infinity;
  return Math.abs((currentPrice - targetPrice) / targetPrice) * 100;
};

/**
 * NextActionPlanのアラートを判定
 */
export const checkNextActionAlert = (
  nextActionPlan: NextActionPlan,
  currentPrice: number,
  positionSummary?: PositionSummary,
  availableCash?: number
): AlertInfo | null => {
  if (!nextActionPlan.targetPrice || nextActionPlan.targetPrice <= 0) {
    return null;
  }

  const analysis = analyzeNextActionPlan(
    nextActionPlan,
    currentPrice,
    positionSummary && positionSummary.totalShares > 0 ? positionSummary : null,
    availableCash
  );

  // 資金不足チェック（最優先）
  if (nextActionPlan.actionType === 'buy' && !analysis.canExecute) {
    return {
      type: 'insufficient-funds',
      analysis,
      gapPercentage: 0
    };
  }

  if (analysis.isApproaching) {
    return { type: 'nextaction-approaching', analysis };
  } else if (analysis.isWarning) {
    return { type: 'nextaction-warning', analysis };
  }

  return null;
};

/**
 * 損切りラインのアラートを判定
 */
export const checkStopLossAlert = (
  currentPrice: number,
  stopLossPrice: number
): AlertInfo | null => {
  if (stopLossPrice <= 0) return null;

  // 既に損切りラインを下回っている場合
  if (currentPrice < stopLossPrice) {
    const exceedPercentage = Math.abs((stopLossPrice - currentPrice) / stopLossPrice) * 100;
    return {
      type: 'stop-loss-exceeded',
      gapPercentage: exceedPercentage,
      stopLossPrice
    };
  }

  // 損切りラインに接近している場合（5%以内）
  const gapPercentage = calculateGapPercentage(currentPrice, stopLossPrice);
  if (gapPercentage <= ALERT_THRESHOLDS.STOP_LOSS_APPROACHING) {
    return {
      type: 'stop-loss',
      gapPercentage,
      stopLossPrice
    };
  }

  return null;
};

/**
 * 利確目標のアラートを判定
 */
export const checkTargetProfitAlert = (
  currentPrice: number,
  targetPrice: number
): AlertInfo | null => {
  if (targetPrice <= 0) return null;

  const gapPercentage = calculateGapPercentage(currentPrice, targetPrice);

  if (gapPercentage <= ALERT_THRESHOLDS.TARGET_PROFIT_APPROACHING) {
    return {
      type: 'target-profit',
      gapPercentage,
      targetPrice
    };
  }

  return null;
};

/**
 * 統合アラートシステムのメイン関数
 * 優先順位に従って最も重要なアラート1つを返す
 */
export const getIntegratedAlert = (
  nextActionPlan: NextActionPlan,
  currentPrice: number,
  targetPrice: number,
  stopLoss: string,
  positionSummary?: PositionSummary,
  availableCash?: number
): AlertInfo => {
  const currentPriceNum = parseFloat(currentPrice.toString());
  const targetPriceNum = parseFloat(targetPrice.toString());
  const stopLossNum = parseFloat(stopLoss);

  // 現在価格が無効な場合はアラートなし
  if (!currentPriceNum || currentPriceNum <= 0) {
    return { type: 'none' };
  }

  // 各アラートをチェック（投資余力現金も考慮）
  const nextActionAlert = checkNextActionAlert(nextActionPlan, currentPriceNum, positionSummary, availableCash);
  const stopLossAlert = checkStopLossAlert(currentPriceNum, stopLossNum);
  const targetProfitAlert = checkTargetProfitAlert(currentPriceNum, targetPriceNum);

  // 優先順位に従って返す（最も重要なもの1つのみ）
  if (nextActionAlert?.type === 'insufficient-funds') {
    return nextActionAlert;
  } else if (stopLossAlert?.type === 'stop-loss-exceeded') {
    return stopLossAlert;
  } else if (nextActionAlert?.type === 'nextaction-approaching') {
    return nextActionAlert;
  } else if (stopLossAlert?.type === 'stop-loss') {
    return stopLossAlert;
  } else if (targetProfitAlert) {
    return targetProfitAlert;
  } else if (nextActionAlert?.type === 'nextaction-warning') {
    return nextActionAlert;
  }

  return { type: 'none' };
};