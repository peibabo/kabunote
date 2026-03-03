'use client';

import { useState, useEffect } from 'react';
import { Position, calculatePositionSummary, formatPrice, formatShares } from '@/types/positions';

interface StockData {
  id: string;
  symbol: string;
  name: string;
  sector?: string | null;
  currentPrice?: number | null;
}

interface SimplePortfolioSummaryProps {
  portfolioData: StockData[];
}

interface PortfolioSummary {
  totalInvestment: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  totalShares: number;
  stocksWithPositions: number;
  stocksWithPrices: number;
  stocksWithoutPrices: number;
}

export default function SimplePortfolioSummary({ portfolioData }: SimplePortfolioSummaryProps) {
  const [summary, setSummary] = useState<PortfolioSummary>({
    totalInvestment: 0,
    totalCurrentValue: 0,
    totalProfitLoss: 0,
    totalProfitLossRate: 0,
    totalShares: 0,
    stocksWithPositions: 0,
    stocksWithPrices: 0,
    stocksWithoutPrices: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateSummary = async () => {
      setIsLoading(true);

      let totalInvestmentAll = 0;
      let totalInvestmentWithPrice = 0;
      let totalCurrentValue = 0;
      let totalSharesAll = 0;
      let stocksWithPositions = 0;
      let stocksWithPrices = 0;
      let stocksWithoutPrices = 0;

      for (const stock of portfolioData) {
        try {
          // 新APIレスポンス: { data: Position[] } 配列形式
          const response = await fetch(`/api/stocks/${stock.id}/position`);
          if (response.ok) {
            const { data: positions } = await response.json();

            if (Array.isArray(positions) && positions.length > 0) {
              const positionSummary = calculatePositionSummary(positions as Position[]);
              if (positionSummary.totalShares === 0) continue;

              stocksWithPositions++;
              totalInvestmentAll += positionSummary.totalCost;
              totalSharesAll += positionSummary.totalShares;

              // 現在株価：portfolioDataに含まれるDB価格を使用（localStorageフォールバック付き）
              let currentPriceNum = stock.currentPrice ?? 0;
              if (!currentPriceNum && typeof window !== 'undefined') {
                const localPrice = localStorage.getItem(`kabunote-current-price-${stock.symbol}`) || '';
                currentPriceNum = parseFloat(localPrice) || 0;
              }

              if (currentPriceNum > 0) {
                stocksWithPrices++;
                totalInvestmentWithPrice += positionSummary.totalCost;
                totalCurrentValue += positionSummary.totalShares * currentPriceNum;
              } else {
                stocksWithoutPrices++;
              }
            }
          }
        } catch (error) {
          console.error(`ポジション取得エラー - ${stock.symbol}:`, error);
        }
      }

      const totalProfitLoss = totalCurrentValue - totalInvestmentWithPrice;
      const totalProfitLossRate = totalInvestmentWithPrice > 0 ? (totalProfitLoss / totalInvestmentWithPrice) * 100 : 0;

      setSummary({
        totalInvestment: totalInvestmentAll,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossRate,
        totalShares: totalSharesAll,
        stocksWithPositions,
        stocksWithPrices,
        stocksWithoutPrices
      });

      setIsLoading(false);
    };

    if (portfolioData.length > 0) {
      calculateSummary();
    } else {
      setIsLoading(false);
    }
  }, [portfolioData]);

  if (summary.stocksWithPositions === 0 && !isLoading) {
    return null;
  }

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-300';
  };

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
          {isLoading ? (
            <span className="text-xs text-gray-400">読み込み中...</span>
          ) : (
            <span className="text-xs text-gray-400">
              ({summary.stocksWithPositions}銘柄でポジション保有中)
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-400">📊 ポートフォリオデータを読み込み中...</div>
        </div>
      ) : (
        <>
          {summary.stocksWithoutPrices > 0 && (
            <div className="mb-4 px-3 py-2 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg text-sm text-blue-300">
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>
                  {summary.stocksWithoutPrices}銘柄で現在の株価が未設定です。
                  「📊 分析」タブで現在の株価を設定すると損益が表示されます
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">総投資額</div>
              <div className="text-lg font-medium text-white">
                {formatPrice(summary.totalInvestment)}円
              </div>
              <div className="text-xs text-gray-500 mt-1 font-medium">
                {formatShares(summary.totalShares)}株
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">現在評価額</div>
              <div className="text-lg font-medium text-blue-300">
                {summary.totalCurrentValue > 0
                  ? `${formatPrice(summary.totalCurrentValue)}円`
                  : '未設定'
                }
              </div>
              {summary.totalCurrentValue > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  現在の株価ベース
                </div>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">損益額</div>
              {summary.totalCurrentValue > 0 ? (
                <div>
                  <div className={`text-lg font-medium ${getProfitLossColor(summary.totalProfitLoss)}`}>
                    {summary.totalProfitLoss >= 0 ? '+' : ''}
                    {formatPrice(summary.totalProfitLoss)}円
                  </div>
                  {summary.totalProfitLoss > 0 && (
                    <div className="text-sm text-green-200 mt-1 font-medium">
                      税引後 {summary.totalProfitLoss >= 0 ? '+' : ''}
                      {formatPrice(Math.round(summary.totalProfitLoss * 0.79685))}円
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-500">未設定</div>
              )}
            </div>

            <div className={`rounded-lg p-3 border ${getProfitLossBgColor(summary.totalProfitLossRate)}`}>
              <div className="text-xs text-gray-300 mb-1">損益率</div>
              {summary.totalCurrentValue > 0 ? (
                <div className={`text-lg font-medium ${getProfitLossColor(summary.totalProfitLoss)}`}>
                  {summary.totalProfitLossRate >= 0 ? '+' : ''}
                  {summary.totalProfitLossRate.toFixed(2)}%
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-500">未設定</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
