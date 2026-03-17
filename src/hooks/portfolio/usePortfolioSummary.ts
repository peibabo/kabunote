import { useMemo } from 'react';
import { PortfolioTargetSummary, StockTargetInfo, Position } from '@/types/positions';
import { calculatePortfolioTargetSummary, calculatePositionSummary, calculateProfitLoss, evaluateCashRatio, type CashRatioEvaluation } from '@/lib/positionCalc';
import { PortfolioDividendSummary } from '@/types/dividend';
import { calculateDividendInfo } from '@/lib/dividendCalc';
import { PortfolioShareholderSummary } from '@/types/shareholder';
import { calculateShareholderBenefit } from '@/lib/shareholderCalc';
import { CustomTag } from '@/types/tags';
import { getCompanyNameSync, getSectorSync } from '@/data/stockNames';

export interface StockData {
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
    description?: string;
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
  dividendSummary: PortfolioDividendSummary;
  shareholderSummary: PortfolioShareholderSummary;
  targetSummary: PortfolioTargetSummary;
}

export interface ChartPortfolioItem {
  symbol: string;
  name: string;
  positions: Position[];
  currentPrice: number | null;
  sector: string | null;
  customTags: CustomTag[];
  dividend: { dividendPerShare: number; frequency: number | null } | null;
  benefit: { minimumShares: number; estimatedValue: number | null } | null;
}

export function usePortfolioSummary(portfolioData: StockData[], cashAmount: string) {
  const overallSummary = useMemo<OverallSummary>(() => {
    let totalInvestmentAll = 0;
    let totalInvestmentWithPrice = 0;
    let totalCurrentValue = 0;
    let totalSharesAll = 0;
    let stocksWithPositions = 0;
    let stocksWithPrices = 0;
    let stocksWithoutPrices = 0;

    const cashAmountNum = parseFloat(cashAmount) || 0;

    let totalAnnualDividend = 0;
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
          summary.averagePrice
        );
        totalAnnualDividend += dividendCalculation.annualDividend;
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
      totalAfterTaxAmount: totalAnnualDividend * (1 - 0.20315),
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
      dividendSummary,
      shareholderSummary,
      targetSummary
    };
  }, [portfolioData, cashAmount]);

  // InvestmentPieChart用データを構築
  const chartPortfolioData = useMemo<ChartPortfolioItem[]>(() => {
    return portfolioData.map(stock => {
      const dividend = stock.dividend?.dividendPerShare
        ? { dividendPerShare: stock.dividend.dividendPerShare, frequency: stock.dividend.frequency }
        : null;

      const benefit = stock.benefit?.minimumShares
        ? { minimumShares: stock.benefit.minimumShares, estimatedValue: stock.benefit.estimatedValue }
        : null;

      const csvName = getCompanyNameSync(stock.symbol);
      const resolvedName = (stock.name && stock.name !== stock.symbol)
        ? stock.name
        : (csvName !== '読み込み中...' && csvName !== '銘柄情報なし' ? csvName : stock.symbol);

      return {
        symbol: stock.symbol,
        name: resolvedName,
        positions: stock.positions || [],
        currentPrice: stock.currentPrice,
        sector: stock.sector || getSectorSync(stock.symbol),
        customTags: (stock.tags || []).map(tag => ({
          id: tag.id,
          label: tag.label,
          color: tag.color as CustomTag['color'],
          createdAt: tag.createdAt,
        })),
        dividend,
        benefit,
      };
    });
  }, [portfolioData]);

  return { overallSummary, chartPortfolioData };
}
