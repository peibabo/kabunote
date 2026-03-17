'use client';

import { OverallSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { formatPrice, formatShares } from '@/lib/positionCalc';
import { formatDividendAmount, formatDividendYield } from '@/lib/dividendCalc';
import { formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';

interface PortfolioOverviewGridProps {
  overallSummary: OverallSummary;
}

function getProfitLossColor(value: number) {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-300';
}

function getProfitLossBgColor(rate: number) {
  if (rate > 0) return 'bg-green-900 border-green-700';
  if (rate < 0) return 'bg-red-900 border-red-700';
  return 'bg-gray-800 border-gray-600';
}

export default function PortfolioOverviewGrid({ overallSummary }: PortfolioOverviewGridProps) {
  return (
    <>
      {/* 現在の株価未設定の誘導メッセージ */}
      {overallSummary.stocksWithoutPrices > 0 && (
        <div className="mb-4 px-3 py-2 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm text-blue-300">
          <div className="flex items-center gap-2">
            <span>💡</span>
            <span>
              {overallSummary.stocksWithoutPrices}銘柄で現在の株価が未設定です。
              「📊 シナリオ」タブで現在の株価を設定すると損益が表示されます
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* 総投資額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">総投資額</div>
          <div className="text-base sm:text-lg font-medium text-white">
            {formatPrice(overallSummary.totalInvestment)}円
          </div>
          <div className="text-xs text-gray-500 mt-1 font-medium">
            {formatShares(overallSummary.totalShares)}株
          </div>
        </div>

        {/* 現在評価額 */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">現在評価額</div>
          <div className="text-base sm:text-lg font-medium text-blue-300">
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
              <div className={`text-base sm:text-lg font-medium ${getProfitLossColor(overallSummary.totalProfitLoss)}`}>
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
            <div className="text-base sm:text-lg font-medium text-gray-500">
              未設定
            </div>
          )}
        </div>

        {/* 損益率 */}
        <div className={`rounded-lg p-3 border ${getProfitLossBgColor(overallSummary.totalProfitLossRate)}`}>
          <div className="text-xs text-gray-300 mb-1">損益率</div>
          {overallSummary.totalCurrentValue > 0 ? (
            <div className={`text-base sm:text-lg font-medium ${getProfitLossColor(overallSummary.totalProfitLoss)}`}>
              {overallSummary.totalProfitLossRate >= 0 ? '+' : ''}
              {overallSummary.totalProfitLossRate.toFixed(2)}%
            </div>
          ) : (
            <div className="text-base sm:text-lg font-medium text-gray-500">
              未設定
            </div>
          )}
        </div>

        {/* 配当サマリー */}
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">年間配当金額</div>
          {overallSummary.dividendSummary.stocksWithDividend > 0 ? (
            <>
              <div className="text-base sm:text-lg font-medium text-green-300">
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
              <div className="text-base sm:text-lg font-medium text-gray-500">
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
              <div className="text-base sm:text-lg font-medium text-purple-300">
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
              <div className="text-base sm:text-lg font-medium text-gray-500">
                未設定
              </div>
              <div className="text-xs text-gray-500 mt-1">
                株主優待情報なし
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
