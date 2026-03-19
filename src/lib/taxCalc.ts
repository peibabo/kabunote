// 税率計算ヘルパー関数

// 特定口座の税率（20.315%）
export const DEFAULT_TAX_RATE = 0.20315;

// NISA口座の税率（非課税）
export const NISA_TAX_RATE = 0;

// 税引後金額を計算
export const calculateAfterTax = (grossAmount: number, taxRate: number): number =>
  grossAmount * (1 - taxRate);

// ポジションリストから株数加重平均税率を計算
export const calculateWeightedTaxRate = (
  positions: Array<{ shares: number; taxRate: number }>
): number => {
  const totalShares = positions.reduce((sum, p) => sum + p.shares, 0);
  if (totalShares === 0) return DEFAULT_TAX_RATE;
  return positions.reduce((sum, p) => sum + p.shares * p.taxRate, 0) / totalShares;
};
