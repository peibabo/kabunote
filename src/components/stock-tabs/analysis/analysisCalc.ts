import { ProfitLossInfo } from '@/types/positions';

export interface ProgressData {
  percentage: number;
  remainingToTarget: number;
  isOverTarget: boolean;
  isUnderStop: boolean;
}

// 個別銘柄のリスクリワード比を計算
export const calculateRiskRewardRatio = (
  profitLossInfo: ProfitLossInfo | null
): number | null => {
  if (!profitLossInfo) return null;

  const { targetProfit, stopLoss: stopLossAmount } = profitLossInfo;

  // 損失額が0以下でない場合（実際に損失がある場合）のみ計算
  if (stopLossAmount >= 0) return null;

  // 利益額 ÷ 損失額の絶対値
  return Math.abs(targetProfit / stopLossAmount);
};

// プログレスバー用の計算
export const calculateProgress = (
  targetPrice: string,
  stopLoss: string,
  currentPrice: string
): ProgressData | null => {
  const target = parseFloat(targetPrice);
  const stop = parseFloat(stopLoss);
  const current = parseFloat(currentPrice);

  if (!target || !stop || !current) return null;

  // 損切ラインを0%、目標価格を100%として位置を計算
  const range = target - stop;
  const currentPosition = current - stop;
  const percentage = Math.max(0, Math.min(100, (currentPosition / range) * 100));

  // 目標までの残り
  const remainingToTarget = ((target - current) / (target - stop)) * 100;

  return {
    percentage,
    remainingToTarget: Math.max(0, remainingToTarget),
    isOverTarget: current > target,
    isUnderStop: current < stop
  };
};
