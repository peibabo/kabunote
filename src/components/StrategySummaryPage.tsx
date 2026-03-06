'use client';

import React, { useState, useMemo } from 'react';
import { useCash } from '@/hooks/useCash';
import { StockData } from '@/hooks/useStockData';
import { NextActionPlan, analyzeNextActionPlan, hasNextActionPlan } from '@/types/nextActionPlan';
import { getIntegratedAlert, AlertType } from '@/utils/alertSystem';
import { getCompanyNameSync } from '@/data/stockNames';
import { calculatePositionSummary } from '@/types/positions';

interface StrategyRowData {
  symbol: string;
  companyName: string;
  plan: NextActionPlan;
  alertType: AlertType;
  currentPrice: number;
  analysis?: any;
}

type SortKey = 'priority' | 'action' | 'alert' | 'symbol';

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

      let analysis = null;
      if (currentPrice > 0) {
        analysis = analyzeNextActionPlan(
          plan,
          currentPrice,
          positionSummary && positionSummary.totalShares > 0 ? positionSummary : null,
          availableCash
        );
      }

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

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(price));
  };

  const getAlertDisplay = (alertType: AlertType) => {
    switch (alertType) {
      case 'insufficient-funds': return { icon: '💸', text: '資金不足', color: 'text-red-400' };
      case 'stop-loss-exceeded': return { icon: '💥', text: '損切り超過', color: 'text-red-400' };
      case 'nextaction-approaching': return { icon: '🚨', text: '目標接近', color: 'text-red-400' };
      case 'stop-loss': return { icon: '🔻', text: '損切り接近', color: 'text-red-400' };
      case 'target-profit': return { icon: '💰', text: '利確接近', color: 'text-green-400' };
      case 'nextaction-warning': return { icon: '⚠️', text: '注意', color: 'text-yellow-400' };
      default: return { icon: '✅', text: 'OK', color: 'text-gray-400' };
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
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm text-gray-400 self-center mr-2">並び替え:</span>
          {[
            { key: 'priority' as SortKey, label: '優先度' },
            { key: 'alert' as SortKey, label: 'アラート' },
            { key: 'action' as SortKey, label: 'アクション' },
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

        {/* モバイルカードレイアウト */}
        <div className="md:hidden space-y-3">
          {sortedData.map((row) => {
            const alertDisplay = getAlertDisplay(row.alertType);
            return (
              <div key={row.symbol} className="bg-gray-800 rounded-lg p-3">
                {/* 1行目: 銘柄 + アクション + 優先度 */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-white text-sm">{row.symbol}</span>
                    <span className="text-xs text-gray-400 truncate">{row.companyName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      row.plan.actionType === 'buy' ? 'bg-green-900/30 text-green-400' :
                      row.plan.actionType === 'sell' ? 'bg-red-900/30 text-red-400' :
                      'bg-yellow-900/30 text-yellow-400'
                    }`}>
                      {row.plan.actionType === 'buy' ? '📈 買い' :
                       row.plan.actionType === 'sell' ? '📉 売り' : '🔄 様子見'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      row.plan.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                      row.plan.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-green-900/30 text-green-400'
                    }`}>
                      {row.plan.priority === 'high' ? '🔴高' :
                       row.plan.priority === 'medium' ? '🟡中' : '🟢低'}
                    </span>
                  </div>
                </div>
                {/* 2行目: 目標価格・現在株価 */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
                  <div>
                    <span className="text-gray-400">目標: </span>
                    <span className="text-white">{(row.plan.targetPrice ?? 0) > 0 ? `${formatPrice(row.plan.targetPrice!)}円` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">現在: </span>
                    <span className="text-white">{row.currentPrice > 0 ? `${formatPrice(row.currentPrice)}円` : '未設定'}</span>
                  </div>
                </div>
                {/* 3行目: 株数・必要資金 */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-1.5">
                  <div>
                    <span className="text-gray-400">株数: </span>
                    <span className="text-white">{(row.plan.targetQuantity ?? 0) > 0 ? `${Math.floor(row.plan.targetQuantity! / 100)}単位` : '-'}</span>
                  </div>
                  {row.plan.actionType === 'buy' && row.analysis && (
                    <div>
                      <span className="text-gray-400">必要: </span>
                      <span className="text-white">{formatPrice(row.analysis.requiredInvestment)}円</span>
                      {!row.analysis.canExecute && <span className="text-red-400 ml-1">⚠</span>}
                    </div>
                  )}
                </div>
                {/* 4行目: ステータス */}
                {row.alertType !== 'none' && (
                  <div className={`flex items-center gap-1 text-xs ${alertDisplay.color}`}>
                    <span>{alertDisplay.icon}</span>
                    <span>{alertDisplay.text}</span>
                  </div>
                )}
              </div>
            );
          })}
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
              {sortedData.map((row) => {
                const alertDisplay = getAlertDisplay(row.alertType);
                return (
                  <tr key={row.symbol} className="hover:bg-gray-750">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-white">{row.symbol}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[150px]">{row.companyName}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.plan.actionType === 'buy' ? 'bg-green-900/30 text-green-400' :
                        row.plan.actionType === 'sell' ? 'bg-red-900/30 text-red-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {row.plan.actionType === 'buy' ? '📈 買い' :
                         row.plan.actionType === 'sell' ? '📉 売り' : '🔄 様子見'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {(row.plan.targetPrice ?? 0) > 0 ? `${formatPrice(row.plan.targetPrice!)}円` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {row.currentPrice > 0 ? `${formatPrice(row.currentPrice)}円` : (
                        <span className="text-gray-500 text-xs">未設定</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {(row.plan.targetQuantity ?? 0) > 0 ? `${Math.floor(row.plan.targetQuantity! / 100)}単位` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.plan.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                        row.plan.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-green-900/30 text-green-400'
                      }`}>
                        {row.plan.priority === 'high' ? '🔴 高' :
                         row.plan.priority === 'medium' ? '🟡 中' : '🟢 低'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`flex items-center justify-center gap-1 ${alertDisplay.color}`}>
                        <span>{alertDisplay.icon}</span>
                        <span className="text-xs">{alertDisplay.text}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {row.analysis && row.plan.actionType === 'buy' ? (
                        <div>
                          <div className="text-white text-sm">
                            {formatPrice(row.analysis.requiredInvestment)}円
                          </div>
                          {!row.analysis.canExecute && (
                            <div className="text-xs text-red-400">資金不足</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* サマリー情報 */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-gray-400 mb-1">総戦略数</div>
            <div className="text-xl sm:text-2xl font-bold text-white">{strategiesData.length}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-gray-400 mb-1">高優先度</div>
            <div className="text-xl sm:text-2xl font-bold text-red-400">
              {strategiesData.filter(s => s.plan.priority === 'high').length}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-gray-400 mb-1">アラート発生</div>
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">
              {strategiesData.filter(s => s.alertType !== 'none').length}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
            <div className="text-sm text-gray-400 mb-1">必要資金合計</div>
            <div className="text-lg font-bold text-white">
              {formatPrice(
                strategiesData
                  .filter(s => s.plan.actionType === 'buy' && s.analysis)
                  .reduce((sum, s) => sum + (s.analysis?.requiredInvestment || 0), 0)
              )}円
            </div>
            <div className="text-xs text-gray-400">
              利用可能: {formatPrice(availableCash)}円
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
