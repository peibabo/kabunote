'use client';

import React, { useState, useMemo } from 'react';
import { useStringLocalStorage, useArrayLocalStorage } from '@/hooks/useLocalStorage';
import { useNextActionPlan, hasNextActionPlan } from '@/hooks/useNextActionPlan';
import { NextActionPlan, analyzeNextActionPlan } from '@/types/nextActionPlan';
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

export default function StrategySummaryPage() {
  const [stocks] = useArrayLocalStorage<string>('kabunote-stocks', []);
  const [cashAmount] = useStringLocalStorage('kabunote-cash-amount', '0');
  const availableCash = parseFloat(cashAmount) || 0;

  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 各銘柄の戦略データを収集
  const strategiesData = useMemo(() => {
    const data: StrategyRowData[] = [];

    stocks.forEach(symbol => {
      // 各銘柄のNextActionPlanを取得（フックは使えないので直接localStorage）
      const planData = localStorage.getItem(`kabunote-next-action-plan-${symbol}`);
      if (!planData) return;

      try {
        const plan: NextActionPlan = JSON.parse(planData);
        if (!hasNextActionPlan(plan)) return;

        const companyName = getCompanyNameSync(symbol);

        // 現在価格・投資規律設定を取得
        const currentPriceStr = localStorage.getItem(`kabunote-current-price-${symbol}`) || '0';
        const targetPriceStr = localStorage.getItem(`kabunote-target-price-${symbol}`) || '0';
        const stopLossStr = localStorage.getItem(`kabunote-stop-loss-${symbol}`) || '0';
        const currentPrice = parseFloat(currentPriceStr);

        // ポジション情報取得
        const positionsData = localStorage.getItem(`kabunote-positions-${symbol}`);
        let positionSummary = null;
        if (positionsData) {
          try {
            const positions = JSON.parse(positionsData);
            positionSummary = calculatePositionSummary(positions);
          } catch (e) {
            console.warn('Failed to parse positions:', e);
          }
        }

        // アラート判定
        const alert = getIntegratedAlert(
          plan,
          currentPrice,
          targetPriceStr,
          stopLossStr,
          positionSummary && positionSummary.totalShares > 0 ? positionSummary : undefined,
          availableCash
        );

        // 分析情報取得
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
          symbol,
          companyName,
          plan,
          alertType: alert.type,
          currentPrice,
          analysis
        });
      } catch (e) {
        console.warn(`Failed to parse plan for ${symbol}:`, e);
      }
    });

    return data;
  }, [stocks, availableCash]);

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
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">🎯 戦略一覧ダッシュボード</h1>
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📊 設定済みの戦略がありません</div>
            <div className="text-sm text-gray-500">銘柄カードの「🎯 次の一手」タブで戦略を設定してください</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">🎯 戦略一覧ダッシュボード</h1>
          <div className="text-sm text-gray-400">
            {strategiesData.length}件の戦略設定
          </div>
        </div>

        {/* ソートコントロール */}
        <div className="flex gap-2 mb-6">
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
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
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

        {/* 戦略一覧テーブル */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">アクション</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">目標価格</th>
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
                      {row.plan.targetPrice > 0 ? `${formatPrice(row.plan.targetPrice)}円` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-white">
                      {row.plan.targetQuantity > 0 ? `${Math.floor(row.plan.targetQuantity / 100)}単位` : '-'}
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総戦略数</div>
            <div className="text-2xl font-bold text-white">{strategiesData.length}</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">高優先度</div>
            <div className="text-2xl font-bold text-red-400">
              {strategiesData.filter(s => s.plan.priority === 'high').length}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">アラート発生</div>
            <div className="text-2xl font-bold text-yellow-400">
              {strategiesData.filter(s => s.alertType !== 'none').length}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
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