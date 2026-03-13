// 配当計算・フォーマット用のヘルパー関数

import type { DividendCalculation } from '@/types/dividend';

// 配当利回りを計算
export const calculateDividendYield = (
  dividendPerShare: number,
  dividendFrequency: number,
  averagePrice: number
): number => {
  if (averagePrice <= 0) return 0;
  return ((dividendPerShare * dividendFrequency) / averagePrice) * 100;
};

// 年間配当金額を計算
export const calculateAnnualDividend = (
  dividendPerShare: number,
  dividendFrequency: number,
  totalShares: number
): number => {
  return dividendPerShare * dividendFrequency * totalShares;
};

// 税引後配当金額を計算（日本の税率20.315%）
export const calculateAfterTaxDividend = (grossAmount: number): number => {
  const TAX_RATE = 0.20315;
  return grossAmount * (1 - TAX_RATE);
};

// 配当関連の計算をまとめて実行
export const calculateDividendInfo = (
  dividendPerShare: number,
  dividendFrequency: number,
  totalShares: number,
  averagePrice: number
): DividendCalculation => {
  const annualDividend = calculateAnnualDividend(dividendPerShare, dividendFrequency, totalShares);
  const dividendYield = calculateDividendYield(dividendPerShare, dividendFrequency, averagePrice);
  const afterTaxAmount = calculateAfterTaxDividend(annualDividend);
  const taxAmount = annualDividend - afterTaxAmount;

  return {
    annualDividend,
    dividendYield,
    afterTaxAmount,
    taxAmount
  };
};

// 数値を配当金額形式でフォーマット
export const formatDividendAmount = (amount: number): string => {
  return Math.round(amount).toLocaleString('ja-JP');
};

// 配当利回りを%形式でフォーマット
export const formatDividendYield = (yieldRate: number): string => {
  return yieldRate.toFixed(2);
};
