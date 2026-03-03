'use client';

import { useMemo, useState } from 'react';
import InvestmentPieChart from '@/components/InvestmentPieChart';
import { formatPrice, formatShares, formatProfitLoss, PortfolioTargetSummary, calculatePortfolioTargetSummary, calculatePositionSummary, calculateProfitLoss, StockTargetInfo, Position } from '@/types/positions';
import { PortfolioDividendSummary, calculateDividendInfo, formatDividendAmount, formatDividendYield } from '@/types/dividend';
import { PortfolioShareholderSummary, calculateShareholderBenefit, formatBenefitValue, formatBenefitYield } from '@/types/shareholder';
import { useStringLocalStorage } from '@/hooks/useLocalStorage';
import { CustomTag } from '@/types/tags';
import { getCompanyNameSync } from '@/data/stockNames';

interface StockData {
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
    name: string;
    color: string;
  }>;
}

interface PortfolioSummaryProps {
  portfolioData: StockData[];
}

interface CashRatioEvaluation {
  status: 'excellent' | 'good' | 'moderate' | 'risky' | 'dangerous';
  message: string;
  icon: string;
  color: string;
}

interface OverallSummary {
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

export default function PortfolioSummary({ portfolioData }: PortfolioSummaryProps) {
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);
  const [isTargetSummaryExpanded, setIsTargetSummaryExpanded] = useState(false);
  const [isRiskRewardExpanded, setIsRiskRewardExpanded] = useState(false);
  // 現金額の状態管理
  const [cashAmount, setCashAmount] = useStringLocalStorage('kabunote-cash-amount', '0', 300);

  // Next Actionメモの状態管理
  const [nextActionMemo, setNextActionMemo] = useStringLocalStorage('kabunote-next-action-memo', '', 300);

  // 現金比率評価を計算する関数
  const evaluateCashRatio = (cashRatio: number, cashAmount: number): CashRatioEvaluation => {
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
  };

  // 全体のサマリーを計算
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

      // 現在株価：DBデータ優先、localStorageフォールバック
      let currentPriceNum = stock.currentPrice ?? 0;
      if (!currentPriceNum && typeof window !== 'undefined') {
        const localPrice = localStorage.getItem(`kabunote-current-price-${stock.symbol}`) || '';
        currentPriceNum = parseFloat(localPrice) || 0;
      }

      if (currentPriceNum > 0) {
        stocksWithPrices++;
        totalInvestmentWithPrice += summary.totalCost;
        totalCurrentValue += summary.totalShares * currentPriceNum;
      } else {
        stocksWithoutPrices++;
      }

      // 配当情報：DBデータ優先、localStorageフォールバック
      let perShare = stock.dividend?.dividendPerShare ?? 0;
      let frequency = stock.dividend?.frequency ?? 0;
      if (!perShare && typeof window !== 'undefined') {
        perShare = parseFloat(localStorage.getItem(`kabunote-dividend-per-share-${stock.symbol}`) || '') || 0;
        frequency = parseInt(localStorage.getItem(`kabunote-dividend-frequency-${stock.symbol}`) || '1') || 1;
      }

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

      // 株主優待情報：DBデータ優先、localStorageフォールバック
      let minShares = stock.benefit?.minimumShares ?? 0;
      let estValue = stock.benefit?.estimatedValue ?? 0;
      if (!minShares && typeof window !== 'undefined') {
        minShares = parseInt(localStorage.getItem(`kabunote-minimum-shares-${stock.symbol}`) || '') || 0;
        estValue = parseFloat(localStorage.getItem(`kabunote-estimated-value-${stock.symbol}`) || '') || 0;
      }

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

      // 目標価格・損切りライン：DBデータ優先、localStorageフォールバック
      let targetPrice: number | undefined = stock.targetPrice ?? undefined;
      let stopLossPrice: number | undefined = stock.stopLossPrice ?? undefined;

      if (!targetPrice && typeof window !== 'undefined') {
        const str = localStorage.getItem(`kabunote-target-price-${stock.symbol}`);
        targetPrice = str ? parseFloat(str) || undefined : undefined;
      }
      if (!stopLossPrice && typeof window !== 'undefined') {
        const str = localStorage.getItem(`kabunote-stop-loss-${stock.symbol}`);
        stopLossPrice = str ? parseFloat(str) || undefined : undefined;
      }

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

  // InvestmentPieChart用データを構築（stockPositionsのポジション + DBの配当・優待データ）
  const chartPortfolioData = useMemo(() => {
    return portfolioData.map(stock => {
      // 配当：DBデータ優先、localStorageフォールバック
      let dividend: { dividendPerShare: number | null; frequency: number | null } | null = null;
      if (stock.dividend?.dividendPerShare) {
        dividend = {
          dividendPerShare: stock.dividend.dividendPerShare,
          frequency: stock.dividend.frequency,
        };
      } else if (typeof window !== 'undefined') {
        const perShareStr = localStorage.getItem(`kabunote-dividend-per-share-${stock.symbol}`);
        const frequencyStr = localStorage.getItem(`kabunote-dividend-frequency-${stock.symbol}`);
        const perShare = perShareStr ? parseFloat(perShareStr) : null;
        if (perShare && perShare > 0) {
          dividend = {
            dividendPerShare: perShare,
            frequency: frequencyStr ? parseInt(frequencyStr) : 1,
          };
        }
      }

      // 優待：DBデータ優先、localStorageフォールバック
      let benefit: { minimumShares: number | null; estimatedValue: number | null } | null = null;
      if (stock.benefit?.minimumShares) {
        benefit = {
          minimumShares: stock.benefit.minimumShares,
          estimatedValue: stock.benefit.estimatedValue,
        };
      } else if (typeof window !== 'undefined') {
        const minSharesStr = localStorage.getItem(`kabunote-minimum-shares-${stock.symbol}`);
        const estValueStr = localStorage.getItem(`kabunote-estimated-value-${stock.symbol}`);
        const minShares = minSharesStr ? parseInt(minSharesStr) : null;
        const estValue = estValueStr ? parseFloat(estValueStr) : null;
        if (minShares && minShares > 0) {
          benefit = {
            minimumShares: minShares,
            estimatedValue: estValue,
          };
        }
      }

      const csvName = getCompanyNameSync(stock.symbol);
      const resolvedName = (stock.name && stock.name !== stock.symbol)
        ? stock.name
        : (csvName !== '読み込み中...' && csvName !== '銘柄情報なし' ? csvName : stock.symbol);

      return {
        symbol: stock.symbol,
        name: resolvedName,
        positions: stock.positions || [],
        currentPrice: stock.currentPrice,
        sector: stock.sector,
        customTags: (stock.tags || []).map(tag => ({
          id: `tag-${tag.name}`,
          label: tag.name,
          color: tag.color as CustomTag['color'],
          createdAt: new Date().toISOString(),
        })),
        dividend,
        benefit,
      };
    });
  }, [portfolioData]);

  // ポジションを持つ銘柄が1つもない場合は表示しない
  if (overallSummary.stocksWithPositions === 0) {
    return null;
  }

  // 損益の色を決定
  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-300';
  };

  // 損益率の背景色を決定
  const getProfitLossBgColor = (rate: number) => {
    if (rate > 0) return 'bg-green-900 border-green-700';
    if (rate < 0) return 'bg-red-900 border-red-700';
    return 'bg-gray-800 border-gray-600';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6 font-thin">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg">💼</span>
          <h2 className="text-lg font-semibold text-white">ポートフォリオサマリー</h2>
          <span className="text-xs text-gray-400">
            ({overallSummary.stocksWithPositions}銘柄でポジション保有中)
          </span>
        </div>
      </div>

      {/* 現在の株価未設定の誘導メッセージ */}
      {overallSummary.stocksWithoutPrices > 0 && (
        <div className="mb-4 px-3 py-2 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm text-blue-300">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>
              {overallSummary.stocksWithoutPrices}銘柄で現在の株価が未設定です。
              「📊 分析」タブで現在の株価を設定すると損益が表示されます
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 総投資額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">総投資額</div>
          <div className="text-lg font-medium text-white">
            {formatPrice(overallSummary.totalInvestment)}円
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">
            {formatShares(overallSummary.totalShares)}株
          </div>
        </div>

        {/* 現在評価額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">現在評価額</div>
          <div className="text-lg font-medium text-blue-300">
            {overallSummary.totalCurrentValue > 0
              ? `${formatPrice(overallSummary.totalCurrentValue)}円`
              : '未設定'
            }
          </div>
          {overallSummary.totalCurrentValue > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              現在の株価ベース
            </div>
          )}
        </div>

        {/* 損益額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">損益額</div>
          {overallSummary.totalCurrentValue > 0 ? (
            <div>
              <div className={`text-lg font-medium ${getProfitLossColor(overallSummary.totalProfitLoss)}`}>
                {overallSummary.totalProfitLoss >= 0 ? '+' : ''}
                {formatPrice(overallSummary.totalProfitLoss)}円
              </div>
              {overallSummary.totalProfitLoss > 0 && (
                <div className="text-sm text-green-200 mt-1 font-medium">
                  税引後 {overallSummary.totalProfitLoss >= 0 ? '+' : ''}
                  {formatPrice(Math.round(overallSummary.totalProfitLoss * 0.79685))}円
                </div>
              )}
            </div>
          ) : (
            <div className="text-lg font-medium text-gray-500">
              未設定
            </div>
          )}
        </div>

        {/* 損益率 */}
        <div className={`rounded-lg p-3 border ${getProfitLossBgColor(overallSummary.totalProfitLossRate)}`}>
          <div className="text-xs text-gray-300 mb-1">損益率</div>
          {overallSummary.totalCurrentValue > 0 ? (
            <div className={`text-lg font-medium ${getProfitLossColor(overallSummary.totalProfitLoss)}`}>
              {overallSummary.totalProfitLossRate >= 0 ? '+' : ''}
              {overallSummary.totalProfitLossRate.toFixed(2)}%
            </div>
          ) : (
            <div className="text-lg font-medium text-gray-500">
              未設定
            </div>
          )}
        </div>

        {/* 配当サマリー */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">年間配当金額</div>
          {overallSummary.dividendSummary.stocksWithDividend > 0 ? (
            <>
              <div className="text-lg font-medium text-green-300">
                {formatDividendAmount(overallSummary.dividendSummary.totalAnnualDividend)}円
              </div>
              <div className="text-sm text-green-200 mt-1 font-medium">
                税引後 {formatDividendAmount(overallSummary.dividendSummary.totalAfterTaxAmount)}円
              </div>
              <div className="text-xs text-gray-500 mt-1">
                利回り <span className="font-medium">{formatDividendYield(overallSummary.dividendSummary.averageDividendYield)}%</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 font-medium">
                {overallSummary.dividendSummary.stocksWithDividend}/{overallSummary.dividendSummary.totalStocksWithPositions}銘柄設定済
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-medium text-gray-500">
                未設定
              </div>
              <div className="text-xs text-gray-500 mt-1">
                配当情報なし
              </div>
            </>
          )}
        </div>

        {/* 株主優待サマリー */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">年間優待価値</div>
          {overallSummary.shareholderSummary.totalStocksWithBenefits > 0 ? (
            <>
              <div className="text-lg font-medium text-purple-300">
                {formatBenefitValue(overallSummary.shareholderSummary.totalEstimatedValue)}円
              </div>
              <div className="text-xs text-gray-500 mt-1">
                優待利回り <span className="font-medium">{formatBenefitYield(overallSummary.shareholderSummary.averageYield)}%</span>
              </div>
              <div className="text-sm text-purple-300 mt-1 font-medium">
                取得可能 {overallSummary.shareholderSummary.totalEligibleStocks}銘柄
              </div>
              <div className="text-xs text-gray-400 mt-1 font-medium">
                {overallSummary.shareholderSummary.totalStocksWithBenefits}/{overallSummary.shareholderSummary.totalStocksWithPositions}銘柄設定済
              </div>
            </>
          ) : (
            <>
              <div className="text-lg font-medium text-gray-500">
                未設定
              </div>
              <div className="text-xs text-gray-500 mt-1">
                株主優待情報なし
              </div>
            </>
          )}
        </div>
      </div>

      {/* 余力現金・キャッシュポジションカード */}
      <div className="mt-4 bg-gray-700 rounded-lg p-3">
        <div className="space-y-2 mb-2">
          {/* 現金入力行 */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-300 whitespace-nowrap">投資余力現金:</label>
              <input
                type="text"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="0"
                className="w-28 text-lg bg-gray-600 border border-gray-500 rounded px-2 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-right"
              />
              <span className="text-xs text-gray-400">円</span>
            </div>

            {/* Total Assets表示（現金が設定されている場合） */}
            {overallSummary.cashAmount > 0 && (
              <div className="text-xs font-medium text-yellow-300 whitespace-nowrap">
                総資産: <span className="text-lg font-normal">{formatPrice(overallSummary.totalAssets)}</span> 円
              </div>
            )}
          </div>

          {/* Next Action メモ */}
          <div className="flex items-center justify-center gap-2">
            <label className="text-xs font-semibold text-gray-300 whitespace-nowrap">Next Action メモ:</label>
            <input
              type="text"
              value={nextActionMemo}
              onChange={(e) => setNextActionMemo(e.target.value)}
              placeholder="この余力現金は○○株が◯円になったときに買い増しする"
              maxLength={100}
              className="flex-1 max-w-2xl text-sm bg-gray-600 border border-gray-500 rounded px-2 py-1.5 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* キャッシュポジション可視化（現金が設定されている場合のみプログレスバー表示） */}
        {overallSummary.cashAmount > 0 && (
          <>
            {/* 比率表示 */}
            <div className="flex justify-between items-center text-xs font-medium mb-1">
              <span className="text-blue-300">
                株式: {overallSummary.stockRatio.toFixed(1)}%
              </span>
              <span className="text-green-400">
                現金: {overallSummary.cashRatio.toFixed(1)}%
              </span>
            </div>

            {/* 極細プログレスバー */}
            <div className="relative mb-2">
              <div className="w-full h-1 bg-green-400 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{
                    width: `${overallSummary.stockRatio}%`,
                    background: 'linear-gradient(to right, #3b82f6, #60a5fa)',
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
                  }}
                ></div>
              </div>
            </div>
          </>
        )}

        {/* 現金比率評価（常に表示） */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-2.5 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1.5">
            <span className="text-sm">{overallSummary.cashRatioEvaluation.icon}</span>
            <span className={`text-xs font-medium ${overallSummary.cashRatioEvaluation.color}`}>
              {overallSummary.cashAmount === 0 ? 'ポートフォリオ分析' : '現金比率評価'}
            </span>
          </div>
          <p className="text-xs text-gray-300 leading-snug">
            {overallSummary.cashRatioEvaluation.message}
          </p>
        </div>
      </div>

      {/* 損益目標サマリーセクション */}
      {(overallSummary.targetSummary.targetSetCount > 0 || overallSummary.targetSummary.stopLossSetCount > 0) && (
        <div className="mt-4">
          {/* アコーディオンヘッダー */}
          <button
            onClick={() => setIsTargetSummaryExpanded(!isTargetSummaryExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer mb-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h3 className="text-sm font-medium text-gray-200">
                損益目標サマリー
              </h3>
              <span className="text-xs text-gray-400">
                ({overallSummary.targetSummary.targetSetCount + overallSummary.targetSummary.stopLossSetCount}/{overallSummary.targetSummary.totalStocksWithPosition}銘柄で設定済み)
              </span>
            </div>
            <div className={`transform transition-transform duration-200 text-gray-400 ${
              isTargetSummaryExpanded ? 'rotate-180' : 'rotate-0'
            }`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4H4z"/>
              </svg>
            </div>
          </button>

          {/* アコーディオンコンテンツ */}
          <div className={`pb-2 overflow-hidden transition-all duration-300 ease-in-out ${
            isTargetSummaryExpanded
              ? 'max-h-[2000px] opacity-100'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 利確目標合計 */}
            {overallSummary.targetSummary.targetSetCount > 0 && (
              <div className="bg-green-900 bg-opacity-30 border border-green-700 rounded-lg p-4">
                <div className="text-xs text-green-300 mb-2">利確目標達成時</div>
                <div className="text-xl font-medium text-green-300">
                  {formatProfitLoss(overallSummary.targetSummary.totalTargetProfit)}円
                </div>
                <div className="text-sm text-green-400 mt-1">
                  {overallSummary.targetSummary.targetSetCount}銘柄で設定
                </div>
              </div>
            )}

            {/* 損切り合計 */}
            {overallSummary.targetSummary.stopLossSetCount > 0 && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
                <div className="text-xs text-red-300 mb-2">損切り実行時</div>
                <div className="text-xl font-medium text-red-300">
                  {formatProfitLoss(overallSummary.targetSummary.totalStopLoss)}円
                </div>
                <div className="text-sm text-red-400 mt-1">
                  {overallSummary.targetSummary.stopLossSetCount}銘柄で設定
                </div>
              </div>
            )}

            {/* リスクリワード比（クリッカブル） */}
            {overallSummary.targetSummary.riskRewardRatio !== null && (
              <button
                onClick={() => setIsRiskRewardExpanded(!isRiskRewardExpanded)}
                className="cursor-pointer bg-blue-900 bg-opacity-30 border border-blue-700 hover:border-blue-600 rounded-lg p-4 w-full transition-all duration-200 hover:bg-blue-800 hover:bg-opacity-30"
              >
                <div className="text-xs text-blue-300 mb-2">リスクリワード比</div>
                <div className="text-xl font-medium text-blue-300">
                  {overallSummary.targetSummary.riskRewardRatio.toFixed(2)}
                </div>
                <div className="text-sm text-blue-400 mt-1 flex items-center justify-center gap-2">
                  <span>
                    {overallSummary.targetSummary.riskRewardRatio >= 2 ? '良好' :
                     overallSummary.targetSummary.riskRewardRatio >= 1 ? '適正' : 'リスク高'}
                  </span>
                  <div className={`transform transition-transform duration-200 ${
                    isRiskRewardExpanded ? 'rotate-180' : 'rotate-0'
                  }`}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4 6l4 4 4-4H4z"/>
                    </svg>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* ネオンライトリスクリワードプログレスバー（アコーディオン） */}
          {overallSummary.targetSummary.riskRewardRatio !== null && (
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isRiskRewardExpanded
                ? 'max-h-96 opacity-100 mt-4'
                : 'max-h-0 opacity-0'
            }`}>
              <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-lg">⚡</span>
                  <h4 className="text-lg font-semibold text-white">リスクリワード可視化</h4>
                  <span className="text-xs text-gray-400">
                    ポートフォリオ全体の損益バランス
                  </span>
                </div>

                {/* プログレスバー */}
                <div className="relative">
                <div className="w-full h-6 bg-gradient-to-r from-red-900 via-gray-800 to-green-900 rounded-full relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-transparent to-green-500/20 rounded-full"></div>

                  <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white transform -translate-x-0.5">
                    <div className="absolute -top-1 left-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 animate-pulse"
                         style={{
                           boxShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)'
                         }}></div>
                  </div>

                  {(() => {
                    const ratio = overallSummary.targetSummary.riskRewardRatio;
                    const maxRatio = 3;
                    const position = Math.min(100, Math.max(0,
                      50 + ((ratio - 1) / (maxRatio - 1)) * 50
                    ));

                    return (
                      <div
                        className="absolute top-0 h-full w-1 transform -translate-x-0.5 transition-all duration-1000"
                        style={{
                          left: `${position}%`,
                          background: ratio >= 2
                            ? 'linear-gradient(to bottom, #10b981, #059669)'
                            : ratio >= 1.5
                            ? 'linear-gradient(to bottom, #f59e0b, #d97706)'
                            : 'linear-gradient(to bottom, #ef4444, #dc2626)',
                          boxShadow: ratio >= 2
                            ? '0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.4)'
                            : ratio >= 1.5
                            ? '0 0 20px rgba(245, 158, 11, 0.8), 0 0 40px rgba(245, 158, 11, 0.4)'
                            : '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <div
                          className="absolute -top-1 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 animate-pulse"
                          style={{
                            background: ratio >= 2
                              ? 'linear-gradient(to bottom, #10b981, #059669)'
                              : ratio >= 1.5
                              ? 'linear-gradient(to bottom, #f59e0b, #d97706)'
                              : 'linear-gradient(to bottom, #ef4444, #dc2626)',
                            boxShadow: ratio >= 2
                              ? '0 0 15px rgba(16, 185, 129, 1), 0 0 30px rgba(16, 185, 129, 0.6)'
                              : ratio >= 1.5
                              ? '0 0 15px rgba(245, 158, 11, 1), 0 0 30px rgba(245, 158, 11, 0.6)'
                              : '0 0 15px rgba(239, 68, 68, 1), 0 0 30px rgba(239, 68, 68, 0.6)'
                          }}
                        ></div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-between items-center mt-3 text-xs">
                  <div className="text-red-300 font-medium flex flex-col items-center">
                    <span>🔻 高リスク</span>
                    <span className="text-red-400 mt-1">0:1</span>
                  </div>
                  <div className="text-white font-medium flex flex-col items-center">
                    <span>⚖️ 取得価格</span>
                    <span className="text-gray-300 mt-1">基準点</span>
                  </div>
                  <div className="text-green-300 font-medium flex flex-col items-center">
                    <span>💰 安全ゾーン</span>
                    <span className="text-green-400 mt-1">3:1+</span>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="text-2xl font-bold text-white mb-2">
                    {overallSummary.targetSummary.riskRewardRatio.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium ${
                    overallSummary.targetSummary.riskRewardRatio >= 2
                      ? 'text-green-400'
                      : overallSummary.targetSummary.riskRewardRatio >= 1.5
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                    {overallSummary.targetSummary.riskRewardRatio >= 2
                      ? '🟢 優秀なリスクリワード比'
                      : overallSummary.targetSummary.riskRewardRatio >= 1.5
                      ? '🟡 適正なリスクリワード比'
                      : '🔴 リスクが高い設定です'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    利益可能性 vs 損失リスクの比率
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* 円グラフセクション（アコーディオン） */}
      {overallSummary.stocksWithPositions > 0 && (
        <div>
          {/* アコーディオンヘッダー */}
          <button
            onClick={() => setIsChartsExpanded(!isChartsExpanded)}
            className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="text-sm font-medium text-gray-200">
                ポートフォリオ分析グラフ
              </h3>
              <span className="text-xs text-gray-400">
                (投資額割合・業種別・タグ別・配当金額割合・株主優待価値割合)
              </span>
            </div>
            <div className={`transform transition-transform duration-200 text-gray-400 ${
              isChartsExpanded ? 'rotate-180' : 'rotate-0'
            }`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 6l4 4 4-4H4z"/>
              </svg>
            </div>
          </button>

          {/* アコーディオンコンテンツ */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isChartsExpanded
              ? 'max-h-[2000px] opacity-100 mt-4'
              : 'max-h-0 opacity-0'
          }`}>
            <div className="grid grid-cols-1 xl:grid-cols-3 lg:grid-cols-2 gap-6">
              <InvestmentPieChart portfolioData={chartPortfolioData} type="investment" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="sector" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="tags" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="dividend" />
              <InvestmentPieChart portfolioData={chartPortfolioData} type="shareholder" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
