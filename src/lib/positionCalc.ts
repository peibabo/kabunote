// ポジション計算・フォーマット用のヘルパー関数

import type { Position, PositionSummary, StockTargetInfo, ProfitLossInfo } from '@/types/positions';
import { calculateWeightedTaxRate, calculateAfterTax, DEFAULT_TAX_RATE } from '@/lib/taxCalc';

// ポジションサマリーを計算
export const calculatePositionSummary = (positions: Position[]): PositionSummary => {
  if (positions.length === 0) {
    return {
      totalShares: 0,
      averagePrice: 0,
      totalCost: 0,
      positionCount: 0,
      weightedTaxRate: DEFAULT_TAX_RATE
    };
  }

  const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
  const totalCost = positions.reduce((sum, pos) => sum + (pos.shares * pos.purchasePrice), 0);
  const averagePrice = totalShares > 0 ? totalCost / totalShares : 0;
  const weightedTaxRate = calculateWeightedTaxRate(positions);

  return {
    totalShares,
    averagePrice,
    totalCost,
    positionCount: positions.length,
    weightedTaxRate
  };
};

// 目標価格・損切ラインによる損益を計算
export const calculateProfitLoss = (
  summary: PositionSummary,
  targetPrice?: number,
  stopLossPrice?: number
): ProfitLossInfo | null => {
  if (!summary ||
      summary.totalShares === 0 ||
      summary.averagePrice === 0 ||
      isNaN(summary.totalShares) ||
      isNaN(summary.averagePrice)) {
    return null;
  }

  const targetProfit = (targetPrice && !isNaN(targetPrice)) ?
    (targetPrice - summary.averagePrice) * summary.totalShares : 0;
  const targetProfitPercent = (targetPrice && !isNaN(targetPrice)) ?
    ((targetPrice - summary.averagePrice) / summary.averagePrice) * 100 : 0;

  const stopLoss = (stopLossPrice && !isNaN(stopLossPrice)) ?
    (stopLossPrice - summary.averagePrice) * summary.totalShares : 0;
  const stopLossPercent = (stopLossPrice && !isNaN(stopLossPrice)) ?
    ((stopLossPrice - summary.averagePrice) / summary.averagePrice) * 100 : 0;

  return {
    targetProfit,
    targetProfitPercent,
    stopLoss,
    stopLossPercent
  };
};

// 数値フォーマット
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ja-JP').format(Math.round(price));
};

export const formatShares = (shares: number): string => {
  return new Intl.NumberFormat('ja-JP').format(shares);
};

export const formatProfitLoss = (amount: number): string => {
  if (isNaN(amount) || !isFinite(amount)) {
    return '---';
  }
  const formatted = new Intl.NumberFormat('ja-JP').format(Math.abs(Math.round(amount)));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
};

// ポートフォリオ全体の損益目標を計算
export const calculatePortfolioTargetSummary = (stocksData: StockTargetInfo[]) => {
  let totalTargetProfit = 0;
  let totalAfterTaxTargetProfit = 0;
  let totalStopLoss = 0;
  let targetSetCount = 0;
  let stopLossSetCount = 0;
  let totalStocksWithPosition = 0;

  stocksData.forEach(stock => {
    if (stock.positionSummary.totalShares > 0 && stock.profitLossInfo) {
      totalStocksWithPosition++;

      if (stock.targetPrice && stock.targetPrice > 0) {
        totalTargetProfit += stock.profitLossInfo.targetProfit;
        const profit = stock.profitLossInfo.targetProfit;
        totalAfterTaxTargetProfit += profit > 0
          ? calculateAfterTax(profit, stock.positionSummary.weightedTaxRate)
          : profit;
        targetSetCount++;
      }

      if (stock.stopLossPrice && stock.stopLossPrice > 0) {
        totalStopLoss += stock.profitLossInfo.stopLoss;
        stopLossSetCount++;
      }
    }
  });

  const riskRewardRatio = totalStopLoss < 0 ?
    Math.abs(totalTargetProfit / totalStopLoss) : null;

  return {
    totalTargetProfit,
    totalAfterTaxTargetProfit,
    totalStopLoss,
    riskRewardRatio,
    targetSetCount,
    stopLossSetCount,
    totalStocksWithPosition
  };
};

// PER/PBR バリュエーション評価
export interface ValuationEvaluation {
  label: string;
  color: string;
  deviationPercent: number | null;
  theoreticalPrice: number | null;
  hasFairValue: boolean;
}

// 乖離率の閾値（±10%以内を適正とする）
const DEVIATION_THRESHOLD = 10;

// 乖離率: (現在値 - 適正値) / 適正値 × 100
export function calculateDeviation(current: number, fair: number): number {
  if (fair <= 0) return 0;
  return ((current - fair) / fair) * 100;
}

// EPS逆算: EPS = 現在株価 / 現在PER
export function calculateEps(currentPrice: number, currentPer: number): number | null {
  if (currentPer <= 0) return null;
  return currentPrice / currentPer;
}

// BPS逆算: BPS = 現在株価 / 現在PBR
export function calculateBps(currentPrice: number, currentPbr: number): number | null {
  if (currentPbr <= 0) return null;
  return currentPrice / currentPbr;
}

// PER理論株価: 適正PER × EPS
export function calculateTheoreticalPriceByPer(
  currentPrice: number, currentPer: number, fairPer: number
): number | null {
  const eps = calculateEps(currentPrice, currentPer);
  if (eps === null) return null;
  return fairPer * eps;
}

// PBR理論株価: 適正PBR × BPS
export function calculateTheoreticalPriceByPbr(
  currentPrice: number, currentPbr: number, fairPbr: number
): number | null {
  const bps = calculateBps(currentPrice, currentPbr);
  if (bps === null) return null;
  return fairPbr * bps;
}

function evaluateByDeviation(current: number, fair: number): { label: string; color: string; deviation: number } {
  const deviation = calculateDeviation(current, fair);
  if (deviation <= -DEVIATION_THRESHOLD) {
    return { label: '割安', color: 'text-green-400', deviation };
  } else if (deviation <= DEVIATION_THRESHOLD) {
    return { label: '適正', color: 'text-yellow-400', deviation };
  } else {
    return { label: '割高', color: 'text-red-400', deviation };
  }
}

// PER（株価収益率）評価
export function evaluatePer(per: number, fairPer?: number | null): ValuationEvaluation {
  if (fairPer != null && fairPer > 0) {
    const { label, color, deviation } = evaluateByDeviation(per, fairPer);
    return { label, color, deviationPercent: deviation, theoreticalPrice: null, hasFairValue: true };
  }
  // 固定閾値（後方互換）
  if (per <= 15) {
    return { label: '割安', color: 'text-green-400', deviationPercent: null, theoreticalPrice: null, hasFairValue: false };
  } else if (per <= 25) {
    return { label: '適正', color: 'text-yellow-400', deviationPercent: null, theoreticalPrice: null, hasFairValue: false };
  } else {
    return { label: '割高', color: 'text-red-400', deviationPercent: null, theoreticalPrice: null, hasFairValue: false };
  }
}

// PBR（株価純資産倍率）評価
export function evaluatePbr(pbr: number, fairPbr?: number | null): ValuationEvaluation {
  if (fairPbr != null && fairPbr > 0) {
    const { label, color, deviation } = evaluateByDeviation(pbr, fairPbr);
    return { label, color, deviationPercent: deviation, theoreticalPrice: null, hasFairValue: true };
  }
  // 固定閾値（後方互換）
  if (pbr < 1.0) {
    return { label: '割安', color: 'text-green-400', deviationPercent: null, theoreticalPrice: null, hasFairValue: false };
  } else if (pbr <= 2.0) {
    return { label: '適正', color: 'text-yellow-400', deviationPercent: null, theoreticalPrice: null, hasFairValue: false };
  } else {
    return { label: '割高', color: 'text-red-400', deviationPercent: null, theoreticalPrice: null, hasFairValue: false };
  }
}

// 現金比率評価
export interface CashRatioEvaluation {
  status: 'excellent' | 'good' | 'moderate' | 'risky' | 'dangerous';
  message: string;
  icon: string;
  color: string;
}

export function evaluateCashRatio(cashRatio: number, cashAmount: number): CashRatioEvaluation {
  if (cashAmount === 0) {
    return {
      status: 'moderate',
      message: '余力現金を入力すると、より詳細なポートフォリオ分析が可能になります',
      icon: '💡',
      color: 'text-blue-400'
    };
  }

  if (cashRatio >= 50) {
    return {
      status: 'dangerous',
      message: '現金比率が高すぎます。投資機会を逃している可能性があります',
      icon: '🔴',
      color: 'text-red-400'
    };
  } else if (cashRatio >= 35) {
    return {
      status: 'risky',
      message: '現金比率がやや高めです。投資バランスを見直しましょう',
      icon: '🟡',
      color: 'text-yellow-400'
    };
  } else if (cashRatio >= 20) {
    return {
      status: 'good',
      message: '理想的な現金比率です。リスク管理と投資のバランスが取れています',
      icon: '🟢',
      color: 'text-green-400'
    };
  } else if (cashRatio >= 10) {
    return {
      status: 'moderate',
      message: '適正な現金比率です。緊急時の備えを考慮しつつ積極的に投資中',
      icon: '🔵',
      color: 'text-blue-400'
    };
  } else if (cashRatio >= 5) {
    return {
      status: 'risky',
      message: '現金比率が低めです。急な調整相場に備えて現金を確保しましょう',
      icon: '🟡',
      color: 'text-yellow-400'
    };
  } else {
    return {
      status: 'dangerous',
      message: '現金不足の状態です。緊急時資金と投資資金の確保を検討してください',
      icon: '🔴',
      color: 'text-red-400'
    };
  }
}
