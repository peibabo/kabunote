'use client';

import React, { useState, useMemo } from 'react';
import { Position } from '@/types/positions';
import { calculatePositionSummary, formatPrice } from '@/lib/positionCalc';
import { calculateAfterTax } from '@/lib/taxCalc';
import { getCompanyNameSync } from '@/data/stockNames';
import { StockData } from '@/hooks/stock/useStockData';
import type { PositionRowData, SortKey } from './positions/types';
import PositionTable from './positions/PositionTable';
import PositionCardList from './positions/PositionCardList';

interface PortfolioPositionsPageProps {
  stockData?: StockData[];
}

export default function PortfolioPositionsPage({ stockData = [] }: PortfolioPositionsPageProps) {
  const [sortBy, setSortBy] = useState<SortKey>('profitLoss');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 各銘柄のポジションデータを収集
  const positionsData = useMemo(() => {
    const data: PositionRowData[] = [];
    let totalPortfolioValue = 0;

    stockData.forEach(stock => {
      if (!stock.positions || stock.positions.length === 0) return;

      const positions: Position[] = stock.positions.map(p => ({
        id: p.id,
        shares: p.shares,
        purchasePrice: p.purchasePrice,
        purchaseDate: p.purchaseDate,
        memo: p.memo,
        taxRate: p.taxRate,
        createdAt: p.createdAt,
      }));

      const positionSummary = calculatePositionSummary(positions);
      if (positionSummary.totalShares === 0) return;

      const currentPrice = stock.currentPrice ?? 0;
      const companyName = stock.name || getCompanyNameSync(stock.symbol);
      const currentValue = currentPrice > 0 ? currentPrice * positionSummary.totalShares : 0;
      const profitLoss = currentValue - positionSummary.totalCost;
      const profitLossRate = positionSummary.totalCost > 0 ? (profitLoss / positionSummary.totalCost) * 100 : 0;
      const profitLossAfterTax = profitLoss > 0 ? calculateAfterTax(profitLoss, positionSummary.weightedTaxRate) : profitLoss;

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

    // ポートフォリオ比率を計算
    data.forEach(row => {
      const value = row.currentValue > 0 ? row.currentValue : row.totalCost;
      row.portfolioWeight = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;
    });

    return data;
  }, [stockData]);

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
      <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📊 保有ポジションがありません</div>
            <div className="text-sm text-gray-500">銘柄カードの「💼 管理」タブでポジションを登録してください</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-6">
          <div className="text-xs sm:text-sm text-gray-400">
            {positionsData.length}銘柄のポジション
          </div>
        </div>

        {/* ソートコントロール */}
        <div className="flex flex-wrap gap-2 mb-6">
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
              className={`cursor-pointer px-2.5 py-1.5 sm:px-3 sm:py-1 text-xs rounded-md transition-colors ${
                sortBy === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {label}
              {sortBy === key && (
                <span className="ml-1">{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>
          ))}
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
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
              {formatPrice(summary.totalInvestment)}円
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総評価額</div>
            <div className="text-lg font-bold text-white">
              {formatPrice(summary.totalCurrentValue)}円
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
              {formatPrice(summary.totalProfitLoss)}円
            </div>
            {summary.totalProfitLoss > 0 && (
              <div className="text-sm text-blue-300 font-medium">
                税引後 +{formatPrice(summary.totalProfitLossAfterTax)}円
              </div>
            )}
            <div className={`text-xs ${getProfitLossColor(summary.totalProfitLoss)}`}>
              {summary.totalProfitLossRate >= 0 ? '+' : ''}
              {summary.totalProfitLossRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* モバイルカードレイアウト */}
        <PositionCardList sortedData={sortedData} getProfitLossColor={getProfitLossColor} />

        {/* デスクトップテーブル */}
        <PositionTable sortedData={sortedData} getProfitLossColor={getProfitLossColor} />
      </div>
    </div>
  );
}
