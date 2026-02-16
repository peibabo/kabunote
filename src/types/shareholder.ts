/**
 * 株主優待情報の型定義
 */

export interface ShareholderBenefit {
  benefitDescription: string;        // 優待内容の説明
  minimumShares: number;            // 必要最小株数
  benefitMonth: number;             // 権利確定月（1-12月）
  estimatedValue: number;           // 優待推定価値（円）
  lastUpdated: string;              // 最終更新日（ISO文字列）
}

export interface ShareholderBenefitInfo {
  benefitDescription: string;        // 優待内容（文字列で保存）
  minimumShares: string;            // 必要最小株数（文字列で保存）
  benefitMonth: string;             // 権利確定月（文字列で保存）
  estimatedValue: string;           // 優待推定価値（文字列で保存）
  lastUpdated: string;              // 最終更新日（ISO文字列）
}

export interface ShareholderBenefitCalculation {
  isEligible: boolean;              // 優待取得資格があるか
  currentShares: number;            // 現在の保有株数
  minimumShares: number;            // 必要最小株数
  shortfall: number;                // 不足株数（資格なしの場合）
  estimatedValue: number;           // 優待推定価値
  yieldOnInvestment: number;        // 投資額に対する優待利回り（%）
}

export interface PortfolioShareholderSummary {
  totalEligibleStocks: number;      // 優待取得資格のある銘柄数
  totalEstimatedValue: number;      // 年間優待推定価値合計
  totalStocksWithBenefits: number;  // 優待情報設定済み銘柄数
  totalStocksWithPositions: number; // ポジションを持つ銘柄数
  averageYield: number;             // ポートフォリオ平均優待利回り
}

/**
 * 株主優待の取得資格と価値を計算
 * @param minimumShares 必要最小株数
 * @param currentShares 現在の保有株数
 * @param estimatedValue 優待推定価値
 * @param totalInvestment 総投資額
 * @returns 株主優待計算結果
 */
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

/**
 * 数値を優待価値形式でフォーマット
 * @param value 価値
 * @returns フォーマットされた文字列
 */
export const formatBenefitValue = (value: number): string => {
  return Math.round(value).toLocaleString('ja-JP');
};

/**
 * 優待利回りを%形式でフォーマット
 * @param yieldRate 優待利回り
 * @returns フォーマットされた文字列
 */
export const formatBenefitYield = (yieldRate: number): string => {
  return yieldRate.toFixed(2);
};

