'use client';

import { useMemo } from 'react';
import { Position, calculatePositionSummary, formatPrice, formatShares } from '@/types/positions';

interface PortfolioData {
  symbol: string;
  name: string;
  positions: Position[];
  currentPrice: string;
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
}

export default function PortfolioSummary({ portfolioData }: PortfolioSummaryProps) {
  // 全体のサマリーを計算
  const overallSummary = useMemo<OverallSummary>(() => {
    let totalInvestment = 0;
    let totalCurrentValue = 0;
    let totalShares = 0;
    let stocksWithPositions = 0;

    portfolioData.forEach(stock => {
      if (stock.positions.length > 0) {
        stocksWithPositions++;
        const summary = calculatePositionSummary(stock.positions);
        totalInvestment += summary.totalCost;
        totalShares += summary.totalShares;

        // 現在価格が設定されている場合は評価額を計算
        if (stock.currentPrice) {
          const currentPriceNum = parseFloat(stock.currentPrice);
          if (!isNaN(currentPriceNum)) {
            totalCurrentValue += summary.totalShares * currentPriceNum;
          }
        }
      }
    });

    const totalProfitLoss = totalCurrentValue - totalInvestment;
    const totalProfitLossRate = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossRate,
      totalShares,
      stocksWithPositions
    };
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
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 font-thin">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg text-white font-thin">💼 ポートフォリオサマリー</h2>
        <div className="text-xs text-gray-400">
          {overallSummary.stocksWithPositions}銘柄でポジション保有中
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 総投資額 */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">総投資額</div>
          <div className="text-lg font-medium text-blue-300">
            {formatPrice(overallSummary.totalInvestment)}円
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatShares(overallSummary.totalShares)}株
          </div>
        </div>

        {/* 現在評価額 */}
        <div className="bg-gray-800 rounded-lg p-3">
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
        <div className="bg-gray-800 rounded-lg p-3">
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
      </div>

      {/* 詳細情報 */}
      {overallSummary.totalCurrentValue === 0 && (
        <div className="mt-3 p-2 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded text-xs text-yellow-300">
          💡 各銘柄の「現在の目安株価」を設定すると、評価額と損益が計算されます
        </div>
      )}
    </div>
  );
}