'use client';

import React, { useState, useMemo } from 'react';
import { useArrayLocalStorage } from '@/hooks/useLocalStorage';
import { Position, calculatePositionSummary, formatShares } from '@/types/positions';
import { getCompanyNameSync } from '@/data/stockNames';
import { StockData } from '@/hooks/useStockData';

interface PositionRowData {
  symbol: string;
  companyName: string;
  totalShares: number;
  averagePrice: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
  profitLossRate: number;
  profitLossAfterTax: number;
  portfolioWeight: number;
}

type SortKey = 'symbol' | 'totalShares' | 'averagePrice' | 'totalCost' | 'currentValue' | 'profitLoss' | 'profitLossRate';

interface PortfolioPositionsPageProps {
  stockData?: StockData[];
  isLoggedIn?: boolean;
}

export default function PortfolioPositionsPage({ stockData = [], isLoggedIn = false }: PortfolioPositionsPageProps) {
  const [localStocks] = useArrayLocalStorage<string>('kabunote-stocks', []);
  const [sortBy, setSortBy] = useState<SortKey>('profitLoss');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 各銘柄のポジションデータを収集
  const positionsData = useMemo(() => {
    const data: PositionRowData[] = [];
    let totalPortfolioValue = 0;

    if (isLoggedIn && stockData.length > 0) {
      // DBデータを使用
      stockData.forEach(stock => {
        if (!stock.positions || stock.positions.length === 0) return;

        const positions: Position[] = stock.positions.map(p => ({
          id: p.id,
          shares: p.shares,
          purchasePrice: p.purchasePrice,
          purchaseDate: p.purchaseDate,
          memo: p.memo,
          createdAt: p.createdAt,
        }));

        const positionSummary = calculatePositionSummary(positions);
        if (positionSummary.totalShares === 0) return;

        const currentPrice = stock.currentPrice ?? 0;
        const companyName = stock.name || getCompanyNameSync(stock.symbol);
        const currentValue = currentPrice > 0 ? currentPrice * positionSummary.totalShares : 0;
        const profitLoss = currentValue - positionSummary.totalCost;
        const profitLossRate = positionSummary.totalCost > 0 ? (profitLoss / positionSummary.totalCost) * 100 : 0;
        const profitLossAfterTax = profitLoss > 0 ? profitLoss * 0.79685 : profitLoss;

        data.push({
          symbol: stock.symbol,
          companyName,
          totalShares: positionSummary.totalShares,
          averagePrice: positionSummary.averagePrice,
          totalCost: positionSummary.totalCost,
          currentPrice,
          currentValue,
          profitLoss,
          profitLossRate,
          profitLossAfterTax,
          portfolioWeight: 0
        });

        totalPortfolioValue += currentValue > 0 ? currentValue : positionSummary.totalCost;
      });
    } else {
      // localStorageフォールバック
      localStocks.forEach(symbol => {
        const positionsJson = localStorage.getItem(`kabunote-positions-${symbol}`);
        if (!positionsJson) return;

        try {
          const positions: Position[] = JSON.parse(positionsJson);
          if (positions.length === 0) return;

          const positionSummary = calculatePositionSummary(positions);
          if (positionSummary.totalShares === 0) return;

          const currentPriceStr = localStorage.getItem(`kabunote-current-price-${symbol}`) || '0';
          const currentPrice = parseFloat(currentPriceStr);

          const companyName = getCompanyNameSync(symbol);
          const currentValue = currentPrice > 0 ? currentPrice * positionSummary.totalShares : 0;
          const profitLoss = currentValue - positionSummary.totalCost;
          const profitLossRate = positionSummary.totalCost > 0 ? (profitLoss / positionSummary.totalCost) * 100 : 0;
          const profitLossAfterTax = profitLoss > 0 ? profitLoss * 0.79685 : profitLoss;

          data.push({
            symbol,
            companyName,
            totalShares: positionSummary.totalShares,
            averagePrice: positionSummary.averagePrice,
            totalCost: positionSummary.totalCost,
            currentPrice,
            currentValue,
            profitLoss,
            profitLossRate,
            profitLossAfterTax,
            portfolioWeight: 0
          });

          totalPortfolioValue += currentValue > 0 ? currentValue : positionSummary.totalCost;
        } catch (e) {
          console.warn(`Failed to parse positions for ${symbol}:`, e);
        }
      });
    }

    // ポートフォリオ比率を計算
    data.forEach(row => {
      const value = row.currentValue > 0 ? row.currentValue : row.totalCost;
      row.portfolioWeight = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
    });

    return data;
  }, [isLoggedIn, stockData, localStocks]);

  // ソート処理
  const sortedData = useMemo(() => {
    return [...positionsData].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'symbol':
          aValue = parseInt(a.symbol);
          bValue = parseInt(b.symbol);
          break;
        case 'totalShares':
          aValue = a.totalShares;
          bValue = b.totalShares;
          break;
        case 'averagePrice':
          aValue = a.averagePrice;
          bValue = b.averagePrice;
          break;
        case 'totalCost':
          aValue = a.totalCost;
          bValue = b.totalCost;
          break;
        case 'currentValue':
          aValue = a.currentValue;
          bValue = b.currentValue;
          break;
        case 'profitLoss':
          aValue = a.profitLoss;
          bValue = b.profitLoss;
          break;
        case 'profitLossRate':
          aValue = a.profitLossRate;
          bValue = b.profitLossRate;
          break;
        default:
          aValue = a.profitLoss;
          bValue = b.profitLoss;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [positionsData, sortBy, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  const getProfitLossColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-300';
  };

  const formatPriceValue = (price: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(price));
  };

  const summary = useMemo(() => {
    const totalInvestment = positionsData.reduce((sum, row) => sum + row.totalCost, 0);
    const totalCurrentValue = positionsData.reduce((sum, row) => sum + (row.currentValue > 0 ? row.currentValue : row.totalCost), 0);
    const totalProfitLoss = positionsData.reduce((sum, row) => sum + row.profitLoss, 0);
    const totalProfitLossAfterTax = positionsData.reduce((sum, row) => sum + row.profitLossAfterTax, 0);
    const totalProfitLossRate = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    return {
      totalStocks: positionsData.length,
      totalInvestment,
      totalCurrentValue,
      totalProfitLoss,
      totalProfitLossAfterTax,
      totalProfitLossRate,
      stocksWithPrices: positionsData.filter(row => row.currentPrice > 0).length,
      stocksWithoutPrices: positionsData.filter(row => row.currentPrice === 0).length
    };
  }, [positionsData]);

  if (positionsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">💼 保有ポジション一覧</h1>
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📊 保有ポジションがありません</div>
            <div className="text-sm text-gray-500">銘柄カードの「💼 管理」タブでポジションを登録してください</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">💼 保有ポジション一覧</h1>

          {/* ソート設定 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 self-center mr-2">並び替え:</span>
            {[
              { key: 'profitLoss' as SortKey, label: '損益額' },
              { key: 'profitLossRate' as SortKey, label: '損益率' },
              { key: 'totalCost' as SortKey, label: '投資額' },
              { key: 'currentValue' as SortKey, label: '評価額' },
              { key: 'symbol' as SortKey, label: '銘柄コード' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleSort(key)}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  sortBy === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {label} {sortBy === key && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            ))}
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">保有銘柄数</div>
            <div className="text-lg font-bold text-white">
              {summary.totalStocks}銘柄
            </div>
            <div className="text-xs text-gray-400">
              株価設定: {summary.stocksWithPrices}銘柄
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総投資額</div>
            <div className="text-lg font-bold text-white">
              {formatPriceValue(summary.totalInvestment)}円
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総評価額</div>
            <div className="text-lg font-bold text-white">
              {formatPriceValue(summary.totalCurrentValue)}円
            </div>
            {summary.stocksWithoutPrices > 0 && (
              <div className="text-xs text-gray-400">
                ({summary.stocksWithoutPrices}銘柄未反映)
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総損益</div>
            <div className={`text-lg font-bold ${getProfitLossColor(summary.totalProfitLoss)}`}>
              {summary.totalProfitLoss >= 0 ? '+' : ''}
              {formatPriceValue(summary.totalProfitLoss)}円
            </div>
            {summary.totalProfitLoss > 0 && (
              <div className="text-sm text-blue-300 font-medium">
                税引後 +{formatPriceValue(summary.totalProfitLossAfterTax)}円
              </div>
            )}
            <div className={`text-xs ${getProfitLossColor(summary.totalProfitLoss)}`}>
              {summary.totalProfitLossRate >= 0 ? '+' : ''}
              {summary.totalProfitLossRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* ポジション一覧テーブル */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">保有株数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">平均取得価額</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">総投資額</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在株価</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在評価額</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">損益額</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">損益率</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">構成比</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedData.map((row) => (
                <tr key={row.symbol} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-white">{row.symbol}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[150px]">{row.companyName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {formatShares(row.totalShares)}株
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {formatPriceValue(row.averagePrice)}円
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {formatPriceValue(row.totalCost)}円
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {row.currentPrice > 0 ? `${formatPriceValue(row.currentPrice)}円` : (
                      <span className="text-gray-500 text-xs">未設定</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {row.currentValue > 0 ? `${formatPriceValue(row.currentValue)}円` : (
                      <span className="text-gray-500 text-xs">算出不可</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.currentPrice > 0 ? (
                      <div>
                        <div className={`font-medium ${getProfitLossColor(row.profitLoss)}`}>
                          {row.profitLoss >= 0 ? '+' : ''}
                          {formatPriceValue(row.profitLoss)}円
                        </div>
                        {row.profitLoss > 0 && (
                          <div className="text-xs text-blue-300">
                            税引後 +{formatPriceValue(row.profitLossAfterTax)}円
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">算出不可</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.currentPrice > 0 ? (
                      <div className={`font-medium ${getProfitLossColor(row.profitLoss)}`}>
                        {row.profitLossRate >= 0 ? '+' : ''}
                        {row.profitLossRate.toFixed(2)}%
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs">算出不可</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-white text-sm">
                      {row.portfolioWeight.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(row.portfolioWeight, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
