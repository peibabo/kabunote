// ポートフォリオサマリー計算ロジック（純粋関数）

import { PortfolioTargetSummary, StockTargetInfo, Position } from '@/types/positions';
import { calculatePortfolioTargetSummary, calculatePositionSummary, calculateProfitLoss, type CashRatioEvaluation, evaluateCashRatio } from '@/lib/positionCalc';
import { calculateWeightedTaxRate } from '@/lib/taxCalc';
import { PortfolioDividendSummary } from '@/types/dividend';
import { calculateDividendInfo } from '@/lib/dividendCalc';
import { PortfolioShareholderSummary } from '@/types/shareholder';
import { calculateShareholderBenefit } from '@/lib/shareholderCalc';

export interface PortfolioStockData {
  id: string;
  symbol: string;
  name: string;
  sector: string | null;
  currentPrice: number | null;
  targetPrice: number | null;
  stopLossPrice: number | null;
  positions: Position[];
  dividend: {
    dividendPerShare: number | null;
    frequency: number | null;
    rightsMonth: number | null;
    rightsDay: number | null;
  } | null;
  benefit: {
    description?: string | null;
    minimumShares: number | null;
    estimatedValue: number | null;
    rightsMonth: number | null;
    rightsDay: number | null;
  } | null;
  tags: Array<{
    id: string;
    label: string;
    color: string;
    createdAt: string;
  }>;
}

export interface OverallSummary {
  totalInvestment: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalShares: number;
  stocksWithPositions: number;
  stocksWithPrices: number;
  stocksWithoutPrices: number;
  cashAmount: number;
  totalAssets: number;
  stockRatio: number;
  cashRatio: number;
  cashRatioEvaluation: CashRatioEvaluation;
  weightedTaxRate: number;
  dividendSummary: PortfolioDividendSummary;
  shareholderSummary: PortfolioShareholderSummary;
  targetSummary: PortfolioTargetSummary;
}

// ポートフォリオのサマリーを計算
export function calculateOverallSummary(portfolioData: PortfolioStockData[], cashAmountStr: string): OverallSummary {
  let totalInvestmentAll = 0;
  let totalInvestmentWithPrice = 0;
  let totalCurrentValue = 0;
  let totalSharesAll = 0;
  let stocksWithPositions = 0;
  let stocksWithPrices = 0;
  let stocksWithoutPrices = 0;

  const cashAmountNum = parseFloat(cashAmountStr) || 0;

  let totalAnnualDividend = 0;
  let totalAfterTaxDividend = 0;
  let totalDividendInvestment = 0;
  let stocksWithDividend = 0;

  let totalEligibleStocks = 0;
  let totalEstimatedValue = 0;
  let totalStocksWithBenefits = 0;
  let totalBenefitInvestment = 0;

  portfolioData.forEach(stock => {
    const positions = stock.positions || [];
    if (positions.length === 0) return;

    const summary = calculatePositionSummary(positions);
    if (summary.totalShares === 0) return;

    stocksWithPositions++;
    totalInvestmentAll += summary.totalCost;
    totalSharesAll += summary.totalShares;

    const currentPriceNum = stock.currentPrice ?? 0;

    if (currentPriceNum > 0) {
      stocksWithPrices++;
      totalInvestmentWithPrice += summary.totalCost;
      totalCurrentValue += summary.totalShares * currentPriceNum;
    } else {
      stocksWithoutPrices++;
    }

    const perShare = stock.dividend?.dividendPerShare ?? 0;
    const frequency = stock.dividend?.frequency ?? 0;

    if (perShare > 0 && summary.totalShares > 0) {
      stocksWithDividend++;
      const dividendCalculation = calculateDividendInfo(
        perShare,
        (frequency || 1) as 1 | 2 | 4,
        summary.totalShares,
        summary.averagePrice,
        summary.weightedTaxRate
      );
      totalAnnualDividend += dividendCalculation.annualDividend;
      totalAfterTaxDividend += dividendCalculation.afterTaxAmount;
      totalDividendInvestment += summary.totalCost;
    }

    const minShares = stock.benefit?.minimumShares ?? 0;
    const estValue = stock.benefit?.estimatedValue ?? 0;

    if (minShares > 0 && estValue > 0 && summary.totalShares > 0) {
      totalStocksWithBenefits++;
      const benefitCalculation = calculateShareholderBenefit(
        minShares,
        summary.totalShares,
        estValue,
        summary.totalCost
      );
      if (benefitCalculation.isEligible) {
        totalEligibleStocks++;
        totalEstimatedValue += benefitCalculation.estimatedValue;
      }
      totalBenefitInvestment += summary.totalCost;
    }
  });

  const totalProfitLoss = totalCurrentValue - totalInvestmentWithPrice;
  const totalProfitLossRate = totalInvestmentWithPrice > 0 ? (totalProfitLoss / totalInvestmentWithPrice) * 100 : 0;

  const averageDividendYield = totalDividendInvestment > 0
    ? (totalAnnualDividend / totalDividendInvestment) * 100
    : 0;

  const dividendSummary: PortfolioDividendSummary = {
    totalAnnualDividend,
    averageDividendYield,
    totalAfterTaxAmount: totalAfterTaxDividend,
    stocksWithDividend,
    totalStocksWithPositions: stocksWithPositions
  };

  const averageYield = totalBenefitInvestment > 0
    ? (totalEstimatedValue / totalBenefitInvestment) * 100
    : 0;

  const shareholderSummary: PortfolioShareholderSummary = {
    totalEligibleStocks,
    totalEstimatedValue,
    totalStocksWithBenefits,
    totalStocksWithPositions: stocksWithPositions,
    averageYield
  };

  // 損益目標サマリー
  const stocksTargetData: StockTargetInfo[] = portfolioData.map(stock => {
    const positions = stock.positions || [];
    const positionSummary = calculatePositionSummary(positions);

    const targetPrice: number | undefined = stock.targetPrice ?? undefined;
    const stopLossPrice: number | undefined = stock.stopLossPrice ?? undefined;

    const profitLossInfo = calculateProfitLoss(positionSummary, targetPrice, stopLossPrice);

    return {
      symbol: stock.symbol,
      positionSummary,
      targetPrice,
      stopLossPrice,
      profitLossInfo
    };
  });

  const targetSummary = calculatePortfolioTargetSummary(stocksTargetData);

  // ポートフォリオ全体の株数加重平均税率を計算
  const allPositions = portfolioData.flatMap(stock => stock.positions || []);
  const portfolioWeightedTaxRate = calculateWeightedTaxRate(allPositions);

  const evaluationValue = totalCurrentValue > 0 ? totalCurrentValue : totalInvestmentAll;
  const totalAssetsValue = evaluationValue + cashAmountNum;
  const stockRatioValue = totalAssetsValue > 0 ? (evaluationValue / totalAssetsValue) * 100 : 0;
  const cashRatioValue = totalAssetsValue > 0 ? (cashAmountNum / totalAssetsValue) * 100 : 0;
  const cashRatioEvaluationValue = evaluateCashRatio(cashRatioValue, cashAmountNum);

  return {
    totalInvestment: totalInvestmentAll,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossRate,
    totalShares: totalSharesAll,
    stocksWithPositions,
    stocksWithPrices,
    stocksWithoutPrices,
    cashAmount: cashAmountNum,
    totalAssets: totalAssetsValue,
    stockRatio: stockRatioValue,
    cashRatio: cashRatioValue,
    cashRatioEvaluation: cashRatioEvaluationValue,
    weightedTaxRate: portfolioWeightedTaxRate,
    dividendSummary,
    shareholderSummary,
    targetSummary
  };
}
