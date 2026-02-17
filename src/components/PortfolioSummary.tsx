'use client';

import { useMemo, useState, useEffect } from 'react';
import { Position, calculatePositionSummary, formatPrice, formatShares } from '@/types/positions';
import { CustomTag } from '@/types/tags';
import { PortfolioDividendSummary, formatDividendAmount, formatDividendYield, calculateDividendInfo } from '@/types/dividend';
import { PortfolioShareholderSummary, calculateShareholderBenefit, formatBenefitValue, formatBenefitYield } from '@/types/shareholder';
import InvestmentPieChart from '@/components/InvestmentPieChart';

interface PortfolioData {
  symbol: string;
  name: string;
  positions: Position[];
  currentPrice: string;
  sector: string;
  customTags: CustomTag[];
}

interface PortfolioSummaryProps {
  portfolioData: PortfolioData[];
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
  dividendSummary: PortfolioDividendSummary;
  shareholderSummary: PortfolioShareholderSummary;
}

export default function PortfolioSummary({ portfolioData }: PortfolioSummaryProps) {
  const [isChartsExpanded, setIsChartsExpanded] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // localStorage の変更を監視してリフレッシュトリガーを更新
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    // localStorage の変更を監視
    window.addEventListener('storage', handleStorageChange);

    // カスタムイベントも監視（同一タブ内での変更用）
    window.addEventListener('localStorageChange', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, []);

  // 全体のサマリーを計算
  const overallSummary = useMemo<OverallSummary>(() => {
    let totalInvestmentAll = 0;
    let totalInvestmentWithPrice = 0;
    let totalCurrentValue = 0;
    let totalSharesAll = 0;
    let stocksWithPositions = 0;
    let stocksWithPrices = 0;
    let stocksWithoutPrices = 0;

    // 配当サマリー用の変数
    let totalAnnualDividend = 0;
    let totalDividendInvestment = 0;
    let stocksWithDividend = 0;

    // 株主優待サマリー用の変数
    let totalEligibleStocks = 0;
    let totalEstimatedValue = 0;
    let totalStocksWithBenefits = 0;
    let totalBenefitInvestment = 0;

    portfolioData.forEach(stock => {
      if (stock.positions.length > 0) {
        stocksWithPositions++;
        const summary = calculatePositionSummary(stock.positions);
        totalInvestmentAll += summary.totalCost;
        totalSharesAll += summary.totalShares;

        // リアルタイムで現在価格を取得
        const currentPrice = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-current-price-${stock.symbol}`) || ''
          : '';

        // 現在価格が設定されている場合は評価額計算に含める
        if (currentPrice) {
          const currentPriceNum = parseFloat(currentPrice);
          if (!isNaN(currentPriceNum) && currentPriceNum > 0) {
            stocksWithPrices++;
            totalInvestmentWithPrice += summary.totalCost;
            totalCurrentValue += summary.totalShares * currentPriceNum;
          } else {
            stocksWithoutPrices++;
          }
        } else {
          stocksWithoutPrices++;
        }

        // 配当情報を取得して計算
        const dividendPerShare = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-dividend-per-share-${stock.symbol}`) || ''
          : '';
        const dividendFrequency = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-dividend-frequency-${stock.symbol}`) || '1'
          : '1';

        const perShare = parseFloat(dividendPerShare);
        const frequency = parseInt(dividendFrequency) as 1 | 2 | 4;

        if (perShare > 0 && summary.totalShares > 0) {
          stocksWithDividend++;
          const dividendCalculation = calculateDividendInfo(
            perShare,
            frequency,
            summary.totalShares,
            summary.averagePrice
          );
          totalAnnualDividend += dividendCalculation.annualDividend;
          totalDividendInvestment += summary.totalCost;
        }

        // 株主優待情報を取得して計算
        const minimumShares = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-minimum-shares-${stock.symbol}`) || ''
          : '';
        const estimatedValue = typeof window !== 'undefined'
          ? localStorage.getItem(`kabunote-estimated-value-${stock.symbol}`) || ''
          : '';

        const minShares = parseInt(minimumShares);
        const estValue = parseFloat(estimatedValue);

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
      }
    });

    // 損益計算は目安株価が設定されている銘柄のみで計算
    const totalProfitLoss = totalCurrentValue - totalInvestmentWithPrice;
    const totalProfitLossRate = totalInvestmentWithPrice > 0 ? (totalProfitLoss / totalInvestmentWithPrice) * 100 : 0;

    // 配当サマリーを作成
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

    // 株主優待サマリーを作成
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

    return {
      totalInvestment: totalInvestmentAll,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossRate,
      totalShares: totalSharesAll,
      stocksWithPositions,
      stocksWithPrices,
      stocksWithoutPrices,
      dividendSummary,
      shareholderSummary
    };
  }, [portfolioData, refreshTrigger]);

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

      {/* 目安株価未設定の誘導メッセージ */}
      {overallSummary.stocksWithoutPrices > 0 && (
        <div className="mb-4 px-3 py-2 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm text-blue-300">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>
              {overallSummary.stocksWithoutPrices}銘柄で目安株価が未設定です。
              「📊 分析」タブで目安株価を設定すると損益が表示されます
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 総投資額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">総投資額</div>
          <div className="text-lg font-medium text-blue-300">
            {formatPrice(overallSummary.totalInvestment)}円
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">
            {formatShares(overallSummary.totalShares)}株
          </div>
        </div>

        {/* 現在評価額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">現在評価額</div>
          <div className="text-lg font-medium text-white">
            {overallSummary.totalCurrentValue > 0
              ? `${formatPrice(overallSummary.totalCurrentValue)}円`
              : '未設定'
            }
          </div>
          {overallSummary.totalCurrentValue > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              目安株価ベース
            </div>
          )}
        </div>

        {/* 損益額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">損益額</div>
          {overallSummary.totalCurrentValue > 0 ? (
            <div className={`text-lg font-medium ${getProfitLossColor(overallSummary.totalProfitLoss)}`}>
              {overallSummary.totalProfitLoss >= 0 ? '+' : ''}
              {formatPrice(overallSummary.totalProfitLoss)}円
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
              <div className="text-xs text-gray-500 mt-1">
                利回り <span className="font-medium">{formatDividendYield(overallSummary.dividendSummary.averageDividendYield)}%</span>
              </div>
              <div className="text-sm text-blue-300 mt-1 font-medium">
                税引後 {formatDividendAmount(overallSummary.dividendSummary.totalAfterTaxAmount)}円
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

      {/* 円グラフセクション（アコーディオン） */}
      {overallSummary.stocksWithPositions > 0 && (
        <div className="mt-6">
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
              {/* 投資額割合円グラフ */}
              <InvestmentPieChart portfolioData={portfolioData} type="investment" />

              {/* 業種別分散円グラフ */}
              <InvestmentPieChart portfolioData={portfolioData} type="sector" />

              {/* タグ別分散円グラフ */}
              <InvestmentPieChart portfolioData={portfolioData} type="tags" />

              {/* 配当金額割合円グラフ */}
              <InvestmentPieChart portfolioData={portfolioData} type="dividend" />

              {/* 株主優待価値割合円グラフ */}
              <InvestmentPieChart portfolioData={portfolioData} type="shareholder" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}