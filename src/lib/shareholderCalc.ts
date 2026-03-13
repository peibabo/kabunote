// 株主優待計算・フォーマット用のヘルパー関数

import type { ShareholderBenefitCalculation } from '@/types/shareholder';

// 株主優待の取得資格と価値を計算
export const calculateShareholderBenefit = (
  minimumShares: number,
  currentShares: number,
  estimatedValue: number,
  totalInvestment: number
): ShareholderBenefitCalculation => {
  const isEligible = currentShares >= minimumShares;
  const shortfall = isEligible ? 0 : minimumShares - currentShares;
  const yieldOnInvestment = totalInvestment > 0 && isEligible
    ? (estimatedValue / totalInvestment) * 100
    : 0;

  return {
    isEligible,
    currentShares,
    minimumShares,
    shortfall,
    estimatedValue: isEligible ? estimatedValue : 0,
    yieldOnInvestment
  };
};

// 数値を優待価値形式でフォーマット
export const formatBenefitValue = (value: number): string => {
  return Math.round(value).toLocaleString('ja-JP');
};

// 優待利回りを%形式でフォーマット
export const formatBenefitYield = (yieldRate: number): string => {
  return yieldRate.toFixed(2);
};
