'use client';

import React, { useState, useMemo } from 'react';
import { NextActionPlan, NextActionPlanAnalysis } from '@/types/nextActionPlan';
import { getAllActiveAlerts, AlertType } from '@/utils/alertSystem';
import { getCompanyNameSync } from '@/data/stockNames';
import { calculatePositionSummary } from '@/lib/positionCalc';
import { useSnooze } from '@/hooks/useSnooze';
import { useCash } from '@/hooks/useCash';
import { StockData } from '@/hooks/useStockData';
import { SnoozeDuration } from '@/types/snooze';
import { SNOOZE_DURATIONS, getTimeUntilUnsnooze, generateAlertKey } from '@/lib/snoozeCalc';

interface AlertRowData {
  symbol: string;
  companyName: string;
  alertType: AlertType;
  alertMessage: string;
  alertDetail: string;
  priority: number; // 0が最高優先度
  gapPercentage?: number;
  currentPrice: number;
  targetPrice?: number;
  stopLossPrice?: number;
}

// アラート表示情報を取得（hoisting対策で関数をコンポーネント外に移動）
const getAlertDisplayInfo = (alert: { type: AlertType; gapPercentage?: number; analysis?: NextActionPlanAnalysis; targetPrice?: number; stopLossPrice?: number }) => {
  switch (alert.type) {
    case 'insufficient-funds':
      return {
        message: '💸 資金不足：投資実行不可',
        detail: alert.analysis && alert.analysis.requiredInvestment && alert.analysis.cashAvailable
          ? `不足額：${new Intl.NumberFormat('ja-JP').format(Math.round(alert.analysis.requiredInvestment - alert.analysis.cashAvailable))}円`
          : '資金確認が必要',
        priority: 0
      };
    case 'stop-loss-exceeded':
      return {
        message: '💥 損切りライン超過',
        detail: alert.gapPercentage ? `超過率${alert.gapPercentage.toFixed(1)}%` : '',
        priority: 1
      };
    case 'nextaction-approaching':
      return {
        message: '🚨 次の一手目標に接近中',
        detail: '乖離率2%以内',
        priority: 2
      };
    case 'stop-loss':
      return {
        message: '🔻 損切りラインに接近',
        detail: alert.gapPercentage ? `乖離率${alert.gapPercentage.toFixed(1)}%` : '',
        priority: 3
      };
    case 'target-profit':
      return {
        message: '💰 利確目標に接近',
        detail: alert.gapPercentage ? `乖離率${alert.gapPercentage.toFixed(1)}%` : '',
        priority: 4
      };
    case 'nextaction-warning':
      return {
        message: '⚠️ 注意：次の一手目標に接近',
        detail: '乖離率2-5%以内',
        priority: 5
      };
    default:
      return {
        message: '',
        detail: '',
        priority: 99
      };
  }
};

interface AlertSummaryPageProps {
  stockData?: StockData[];
}

export default function AlertSummaryPage({ stockData = [] }: AlertSummaryPageProps) {
  const { cashAmount } = useCash();
  const availableCash = parseFloat(cashAmount) || 0;
  const [showSnoozed, setShowSnoozed] = useState(false);

  // スヌーズ機能フック
  const {
    snoozedAlerts,
    isLoaded: snoozeLoaded,
    snoozeAlert,
    unsnoozeAlert,
    isAlertSnoozed
  } = useSnooze();

  // 銘柄のアラートを収集する共通処理
  const collectAlerts = (
    symbol: string,
    companyName: string,
    currentPrice: number,
    targetPrice: number,
    stopLossPrice: number,
    plan: NextActionPlan,
    positionSummary: ReturnType<typeof calculatePositionSummary> | null,
    alerts: AlertRowData[]
  ) => {
    const alertList = getAllActiveAlerts(
      plan,
      currentPrice,
      targetPrice,
      stopLossPrice.toString(),
      positionSummary && positionSummary.totalShares > 0 ? positionSummary : undefined,
      availableCash
    );

    alertList.forEach(alert => {
      const { message, detail, priority } = getAlertDisplayInfo(alert);

      if (!showSnoozed && !isAlertSnoozed(symbol, alert.type)) {
        alerts.push({
          symbol, companyName, alertType: alert.type, alertMessage: message,
          alertDetail: detail, priority, gapPercentage: alert.gapPercentage,
          currentPrice, targetPrice: alert.targetPrice, stopLossPrice: alert.stopLossPrice
        });
      } else if (showSnoozed && isAlertSnoozed(symbol, alert.type)) {
        alerts.push({
          symbol, companyName, alertType: alert.type, alertMessage: message,
          alertDetail: detail, priority, gapPercentage: alert.gapPercentage,
          currentPrice, targetPrice: alert.targetPrice, stopLossPrice: alert.stopLossPrice
        });
      }
    });
  };

  // アラートデータを収集（スヌーズ済みを除外）
  const alertsData = useMemo(() => {
    if (!snoozeLoaded) return [];

    const alerts: AlertRowData[] = [];

    stockData.forEach(stock => {
      const currentPrice = stock.currentPrice ?? 0;
      if (currentPrice <= 0) return;

      const targetPrice = stock.targetPrice ?? 0;
      const stopLossPrice = stock.stopLossPrice ?? 0;
      const companyName = stock.name || getCompanyNameSync(stock.symbol);

      const nap = stock.nextActionPlan;
      const plan: NextActionPlan = nap ? {
        id: 'db',
        actionType: nap.actionType as 'buy' | 'sell' | 'hold',
        priority: nap.priority as 'high' | 'medium' | 'low',
        targetPrice: nap.targetPrice ?? 0,
        targetQuantity: nap.targetShares ?? 0,
        memo: nap.strategyMemo,
        updatedAt: '',
      } : {
        id: '', targetPrice: 0, targetQuantity: 0, memo: '',
        actionType: 'buy', priority: 'medium', updatedAt: ''
      };

      const positionSummary = stock.positions.length > 0
        ? calculatePositionSummary(stock.positions)
        : null;

      collectAlerts(stock.symbol, companyName, currentPrice, targetPrice, stopLossPrice, plan, positionSummary, alerts);
    });

    return alerts.sort((a, b) => a.priority - b.priority);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- collectAlerts は availableCash, showSnoozed, isAlertSnoozed に依存するクロージャ。個別に列挙済み
  }, [stockData, availableCash, snoozeLoaded, showSnoozed, isAlertSnoozed, collectAlerts]);

  // アラート種別に応じたスタイル取得
  const getAlertStyles = (alertType: AlertType) => {
    switch (alertType) {
      case 'insufficient-funds':
      case 'stop-loss-exceeded':
      case 'nextaction-approaching':
      case 'stop-loss':
        return 'bg-red-900/20 border-red-500/30 text-red-400';
      case 'target-profit':
        return 'bg-green-900/20 border-green-500/30 text-green-400';
      case 'nextaction-warning':
      default:
        return 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400';
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.round(price));
  };

  // 統計情報
  const stats = useMemo(() => {
    const total = alertsData.length;
    const urgent = alertsData.filter(a => a.priority <= 2).length; // 資金不足・損切り超過・次の一手緊急
    const byType = alertsData.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    return { total, urgent, byType };
  }, [alertsData]);

  if (!snoozeLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📊 データを読み込み中...</div>
          </div>
        </div>
      </div>
    );
  }

  if (alertsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">✅ 現在アラートはありません</div>
            <div className="text-sm text-gray-500">
              すべての銘柄が正常な状態です。投資戦略に応じて価格が変動したらアラートが表示されます。
            </div>
            <div className="text-xs text-gray-600 mt-4">
              対象銘柄数: {stockData.length}件 | 投資余力現金: {new Intl.NumberFormat('ja-JP').format(availableCash)}円
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSnoozed(!showSnoozed)}
              className={`cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                showSnoozed
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showSnoozed ? '💤 スヌーズ履歴' : '🔔 アクティブのみ'}
            </button>
            <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
              {showSnoozed
                ? `${stats.total}件のスヌーズ履歴`
                : `${stats.total}件（緊急: ${stats.urgent}件）`
              }
            </div>
          </div>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">総アラート数</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">緊急アラート</div>
            <div className="text-2xl font-bold text-red-400">{stats.urgent}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">資金不足</div>
            <div className="text-2xl font-bold text-red-400">
              {stats.byType['insufficient-funds'] || 0}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">損切り関連</div>
            <div className="text-2xl font-bold text-red-400">
              {(stats.byType['stop-loss-exceeded'] || 0) + (stats.byType['stop-loss'] || 0)}
            </div>
          </div>
        </div>

        {/* アラート一覧テーブル（デスクトップ） */}
        <div className="hidden md:block bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">アラート</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">詳細</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在価格</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">対象価格</th>
                {!showSnoozed && <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">スヌーズ</th>}
                {showSnoozed && <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">スヌーズ状況</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {alertsData.map((alert, index) => (
                <tr key={`${alert.symbol}-${index}`} className="hover:bg-gray-750">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium text-white">{alert.symbol}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[150px]">{alert.companyName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`px-3 py-2 rounded-lg border text-xs text-center ${getAlertStyles(alert.alertType)}`}>
                      {alert.alertMessage}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-300">
                    {alert.alertDetail}
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {formatPrice(alert.currentPrice)}円
                  </td>
                  <td className="px-4 py-3 text-center text-white">
                    {alert.targetPrice ? `${formatPrice(alert.targetPrice)}円` :
                     alert.stopLossPrice ? `${formatPrice(alert.stopLossPrice)}円` : '-'}
                  </td>
                  {!showSnoozed && (
                    <td className="px-4 py-3 text-center">
                      <div className="relative">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const duration = parseInt(e.target.value) as SnoozeDuration;
                              snoozeAlert(
                                alert.symbol,
                                alert.alertType,
                                duration,
                                {
                                  companyName: alert.companyName,
                                  alertMessage: alert.alertMessage,
                                  alertDetail: alert.alertDetail,
                                  currentPrice: alert.currentPrice,
                                  targetPrice: alert.targetPrice,
                                  stopLossPrice: alert.stopLossPrice
                                }
                              );
                              e.target.value = '';
                            }
                          }}
                          className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 hover:bg-gray-600 focus:outline-none focus:border-blue-500"
                          defaultValue=""
                        >
                          <option value="" disabled>💤 スヌーズ</option>
                          {SNOOZE_DURATIONS.map(({ value, label, icon }) => (
                            <option key={value} value={value}>
                              {icon} {label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  )}
                  {showSnoozed && (
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const snoozedAlert = snoozedAlerts.find(
                          s => s.symbol === alert.symbol && s.alertType === alert.alertType
                        );
                        if (!snoozedAlert) return '-';

                        return (
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-xs text-blue-400">
                              {getTimeUntilUnsnooze(snoozedAlert.snoozeUntil)}
                            </div>
                            <button
                              onClick={() => unsnoozeAlert(generateAlertKey(alert.symbol, alert.alertType))}
                              className="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
                            >
                              解除
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* アラート一覧カード（モバイル） */}
        <div className="md:hidden space-y-3">
          {alertsData.map((alert, index) => (
            <div key={`mobile-${alert.symbol}-${index}`} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-white text-sm">{alert.symbol}</span>
                  <span className="text-xs text-gray-400 ml-2 truncate">{alert.companyName}</span>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border text-xs mb-2 ${getAlertStyles(alert.alertType)}`}>
                {alert.alertMessage}
                {alert.alertDetail && (
                  <span className="ml-2 text-gray-300">({alert.alertDetail})</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">現在価格: </span>
                  <span className="text-white">{formatPrice(alert.currentPrice)}円</span>
                </div>
                <div>
                  <span className="text-gray-400">対象価格: </span>
                  <span className="text-white">
                    {alert.targetPrice ? `${formatPrice(alert.targetPrice)}円` :
                     alert.stopLossPrice ? `${formatPrice(alert.stopLossPrice)}円` : '-'}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700">
                {!showSnoozed && (
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const duration = parseInt(e.target.value) as SnoozeDuration;
                        snoozeAlert(
                          alert.symbol,
                          alert.alertType,
                          duration,
                          {
                            companyName: alert.companyName,
                            alertMessage: alert.alertMessage,
                            alertDetail: alert.alertDetail,
                            currentPrice: alert.currentPrice,
                            targetPrice: alert.targetPrice,
                            stopLossPrice: alert.stopLossPrice
                          }
                        );
                        e.target.value = '';
                      }
                    }}
                    className="w-full bg-gray-700 text-gray-300 text-xs px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
                    defaultValue=""
                  >
                    <option value="" disabled>💤 スヌーズ</option>
                    {SNOOZE_DURATIONS.map(({ value, label, icon }) => (
                      <option key={value} value={value}>
                        {icon} {label}
                      </option>
                    ))}
                  </select>
                )}
                {showSnoozed && (() => {
                  const snoozedAlert = snoozedAlerts.find(
                    s => s.symbol === alert.symbol && s.alertType === alert.alertType
                  );
                  if (!snoozedAlert) return <span className="text-xs text-gray-500">-</span>;
                  return (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-blue-400">
                        {getTimeUntilUnsnooze(snoozedAlert.snoozeUntil)}
                      </span>
                      <button
                        onClick={() => unsnoozeAlert(generateAlertKey(alert.symbol, alert.alertType))}
                        className="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
                      >
                        解除
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>

        {/* 操作ガイド */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-300 text-xs sm:text-sm font-medium">💡 アラート対応のヒント</span>
          </div>
          <div className="text-blue-200 text-xs sm:text-sm space-y-1">
            <div>• 緊急度の高いアラート（赤色）から優先的に確認してください</div>
            <div>• 各銘柄のカードで詳細な戦略設定・価格調整が可能です</div>
            <div>• 資金不足の場合は投資余力現金の追加を検討してください</div>
          </div>
        </div>
      </div>
    </div>
  );
}