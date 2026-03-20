// 保有ポジション管理用の型定義

export interface Position {
  id: string;
  shares: number; // 保有株数
  purchasePrice: number; // 取得価額（1株あたり）
  purchaseDate: string; // 取得日（YYYY-MM-DD形式）
  memo?: string; // ポジション固有のメモ
  taxRate: number; // 税率（0=NISA, 0.20315=特定口座）
  createdAt: string;
}

export interface PositionSummary {
  totalShares: number; // 総保有株数
  averagePrice: number; // 平均取得価額
  totalCost: number; // 総投資額（取得金額合計）
  positionCount: number; // ポジション数
  weightedTaxRate: number; // 株数加重平均税率
}

// ポジション損益計算
export interface ProfitLossInfo {
  targetProfit: number; // 目標価格での利益
  targetProfitPercent: number; // 目標価格での利益率（%）
  stopLoss: number; // 損切ラインでの損失
  stopLossPercent: number; // 損切ラインでの損失率（%）
}

// ポートフォリオ損益目標サマリー
export interface PortfolioTargetSummary {
  totalTargetProfit: number;     // 利確目標合計金額（税引前）
  totalAfterTaxTargetProfit: number; // 利確目標合計金額（税引後）
  totalStopLoss: number;         // 損切り合計金額
  riskRewardRatio: number | null; // リスクリワード比
  targetSetCount: number;        // 目標価格設定済み銘柄数
  stopLossSetCount: number;      // 損切りライン設定済み銘柄数
  totalStocksWithPosition: number; // ポジションを持つ銘柄数
}

// 銘柄別の損益目標情報
export interface StockTargetInfo {
  symbol: string;
  positionSummary: PositionSummary;
  targetPrice?: number;
  stopLossPrice?: number;
  profitLossInfo: ProfitLossInfo | null;
}
