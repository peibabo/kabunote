// 保有ポジション管理用の型定義

export interface Position {
  id: string;
  shares: number; // 保有株数
  purchasePrice: number; // 取得価額（1株あたり）
  purchaseDate: string; // 取得日（YYYY-MM-DD形式）
  memo?: string; // ポジション固有のメモ
  createdAt: string;
}

export interface PositionSummary {
  totalShares: number; // 総保有株数
  averagePrice: number; // 平均取得価額
  totalCost: number; // 総投資額
  positionCount: number; // ポジション数
}

// ポジション計算用のヘルパー関数
export const calculatePositionSummary = (positions: Position[]): PositionSummary => {
  if (positions.length === 0) {
    return {
      totalShares: 0,
      averagePrice: 0,
      totalCost: 0,
      positionCount: 0
    };
  }

  const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
  const totalCost = positions.reduce((sum, pos) => sum + (pos.shares * pos.purchasePrice), 0);
  const averagePrice = totalShares > 0 ? totalCost / totalShares : 0;

  return {
    totalShares,
    averagePrice,
    totalCost,
    positionCount: positions.length
  };
};

// ポジション損益計算
export interface ProfitLossInfo {
  targetProfit: number; // 目標価格での利益
  targetProfitPercent: number; // 目標価格での利益率（%）
  stopLoss: number; // 損切ラインでの損失
  stopLossPercent: number; // 損切ラインでの損失率（%）
}

// 目標価格・損切ラインによる損益を計算
export const calculateProfitLoss = (
  summary: PositionSummary,
  targetPrice?: number,
  stopLossPrice?: number
): ProfitLossInfo | null => {
  if (summary.totalShares === 0 || summary.averagePrice === 0) {
    return null;
  }

  const targetProfit = targetPrice ? (targetPrice - summary.averagePrice) * summary.totalShares : 0;
  const targetProfitPercent = targetPrice ? ((targetPrice - summary.averagePrice) / summary.averagePrice) * 100 : 0;

  const stopLoss = stopLossPrice ? (stopLossPrice - summary.averagePrice) * summary.totalShares : 0;
  const stopLossPercent = stopLossPrice ? ((stopLossPrice - summary.averagePrice) / summary.averagePrice) * 100 : 0;

  return {
    targetProfit,
    targetProfitPercent,
    stopLoss,
    stopLossPercent
  };
};

// 数値フォーマット用のヘルパー関数
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ja-JP').format(Math.round(price));
};

export const formatShares = (shares: number): string => {
  return new Intl.NumberFormat('ja-JP').format(shares);
};

export const formatProfitLoss = (amount: number): string => {
  const formatted = new Intl.NumberFormat('ja-JP').format(Math.abs(Math.round(amount)));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
};