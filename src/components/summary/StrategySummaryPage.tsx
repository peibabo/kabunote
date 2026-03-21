'use client';

import React, { useState, useMemo } from 'react';
import { useCash } from '@/hooks/auth/useCash';
import { StockData } from '@/hooks/stock/useStockData';
import { NextActionPlan } from '@/types/nextActionPlan';
import { analyzeNextActionPlan, hasNextActionPlan } from '@/lib/nextActionPlanCalc';
import { getIntegratedAlert } from '@/utils/alertSystem';
import { getCompanyNameSync } from '@/data/stockNames';
import { calculatePositionSummary, formatPrice } from '@/lib/positionCalc';
import { StrategyRowData, SortKey } from './strategy/types';
import StrategyMobileCard from './strategy/StrategyMobileCard';
import StrategyTableRow from './strategy/StrategyTableRow';
import StrategySummaryStats from './strategy/StrategySummaryStats';
import SortControls from './strategy/SortControls';

interface StrategySummaryPageProps {
  stockData?: StockData[];
}

export default function StrategySummaryPage({ stockData = [] }: StrategySummaryPageProps) {
  const { cashAmount } = useCash();
  const availableCash = parseFloat(cashAmount) || 0;

  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 各銘柄の戦略データを収集
  const strategiesData = useMemo(() => {
    const data: StrategyRowData[] = [];

    stockData.forEach(stock => {
      const nap = stock.nextActionPlan;
      if (!nap) return;

      const plan: NextActionPlan = {
        id: 'db',
        actionType: nap.actionType as 'buy' | 'sell' | 'hold',
        priority: nap.priority as 'high' | 'medium' | 'low',
        targetPrice: nap.targetPrice,
        targetQuantity: nap.targetShares,
        memo: nap.strategyMemo,
        updatedAt: '',
      };

      if (!hasNextActionPlan(plan)) return;

      const companyName = stock.name || getCompanyNameSync(stock.symbol);
      const currentPrice = stock.currentPrice ?? 0;
      const targetPrice = stock.targetPrice ?? 0;
      const stopLossPrice = stock.stopLossPrice ?? 0;

      const positionSummary = stock.positions.length > 0
        ? calculatePositionSummary(stock.positions)
        : null;

      const alert = getIntegratedAlert(
        plan,
        currentPrice,
        targetPrice,
        stopLossPrice.toString(),
        positionSummary && positionSummary.totalShares > 0 ? positionSummary : undefined,
        availableCash
      );

      const analysis = currentPrice > 0
        ? analyzeNextActionPlan(
            plan,
            currentPrice,
            positionSummary && positionSummary.totalShares > 0 ? positionSummary : null,
            availableCash
          )
        : undefined;

      data.push({
        symbol: stock.symbol,
        companyName,
        plan,
        alertType: alert.type,
        currentPrice,
        analysis,
      });
    });

    return data;
  }, [stockData, availableCash]);

  // ソート処理
  const sortedData = useMemo(() => {
    return [...strategiesData].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.plan.priority] - priorityOrder[b.plan.priority];
          break;
        case 'action':
          comparison = a.plan.actionType.localeCompare(b.plan.actionType);
          break;
        case 'alert':
          const alertPriority = {
            'insufficient-funds': 6,
            'stop-loss-exceeded': 5,
            'nextaction-approaching': 4,
            'stop-loss': 3,
            'target-profit': 2,
            'nextaction-warning': 1,
            'none': 0
          };
          comparison = alertPriority[a.alertType] - alertPriority[b.alertType];
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [strategiesData, sortBy, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };

  if (strategiesData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📊 設定済みの戦略がありません</div>
            <div className="text-sm text-gray-500">銘柄カードの「🎯 次の一手」タブで戦略を設定してください</div>
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
            {strategiesData.length}件の戦略設定
          </div>
        </div>

        {/* ソートコントロール */}
        <SortControls sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} />

        {/* モバイルカードレイアウト */}
        <div className="md:hidden space-y-3">
          {sortedData.map((row) => (
            <StrategyMobileCard key={row.symbol} row={row} />
          ))}
        </div>

        {/* 戦略一覧テーブル（デスクトップ） */}
        <div className="hidden md:block bg-gray-800 rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">アクション</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">目標価格</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在株価</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">株数</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">優先度</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">ステータス</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">必要資金</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedData.map((row) => (
                <StrategyTableRow key={row.symbol} row={row} />
              ))}
            </tbody>
          </table>
        </div>

        {/* サマリー情報 */}
        <StrategySummaryStats strategiesData={strategiesData} availableCash={availableCash} />
      </div>
    </div>
  );
}
