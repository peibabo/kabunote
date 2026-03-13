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
