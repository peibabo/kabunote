/**
 * 配当情報の型定義
 */

export interface DividendInfo {
  dividendPerShare: string;          // 1株当たり配当金（文字列で保存）
  dividendFrequency: 1 | 2 | 4;      // 配当頻度（年1回/年2回/年4回）
  lastUpdated: string;              // 最終更新日（ISO文字列）
}

export interface DividendCalculation {
  annualDividend: number;           // 年間配当金額
  dividendYield: number;            // 配当利回り（%）
  afterTaxAmount: number;           // 税引後受取額
  taxAmount: number;                // 税金額
}

export interface PortfolioDividendSummary {
  totalAnnualDividend: number;      // 全銘柄の年間配当金額合計
  averageDividendYield: number;     // ポートフォリオ平均配当利回り
  totalAfterTaxAmount: number;      // 税引後の年間受取総額
  stocksWithDividend: number;       // 配当設定済み銘柄数
  totalStocksWithPositions: number; // ポジションを持つ銘柄数
}

/**
 * 配当利回りを計算
 * @param dividendPerShare 1株当たり配当金
 * @param dividendFrequency 配当頻度
 * @param averagePrice 平均取得価額
 * @returns 配当利回り（%）
 */
export const calculateDividendYield = (
  dividendPerShare: number,
  dividendFrequency: number,
  averagePrice: number
): number => {
  if (averagePrice <= 0) return 0;
  return ((dividendPerShare * dividendFrequency) / averagePrice) * 100;
};

/**
 * 年間配当金額を計算
 * @param dividendPerShare 1株当たり配当金
 * @param dividendFrequency 配当頻度
 * @param totalShares 保有株数
 * @returns 年間配当金額
 */
export const calculateAnnualDividend = (
  dividendPerShare: number,
  dividendFrequency: number,
  totalShares: number
): number => {
  return dividendPerShare * dividendFrequency * totalShares;
};

/**
 * 税引後配当金額を計算（日本の税率20.315%）
 * @param grossAmount 税引前配当金額
 * @returns 税引後配当金額
 */
export const calculateAfterTaxDividend = (grossAmount: number): number => {
  const TAX_RATE = 0.20315; // 日本の配当税率
  return grossAmount * (1 - TAX_RATE);
};

/**
 * 配当関連の計算をまとめて実行
 * @param dividendPerShare 1株当たり配当金
 * @param dividendFrequency 配当頻度
 * @param totalShares 保有株数
 * @param averagePrice 平均取得価額
 * @returns 配当計算結果
 */
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

/**
 * 数値を配当金額形式でフォーマット
 * @param amount 金額
 * @returns フォーマットされた文字列
 */
export const formatDividendAmount = (amount: number): string => {
  return Math.round(amount).toLocaleString('ja-JP');
};

/**
 * 配当利回りを%形式でフォーマット
 * @param yield 配当利回り
 * @returns フォーマットされた文字列
 */
export const formatDividendYield = (yieldRate: number): string => {
  return yieldRate.toFixed(2);
};