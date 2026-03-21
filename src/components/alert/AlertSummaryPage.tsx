'use client';

import React from 'react';
import { StockData } from '@/hooks/stock/useStockData';
import { SnoozeDuration } from '@/types/snooze';
import {
  useAlertSummaryData,
  getAlertStyles,
  formatAlertPrice,
  type AlertRowData,
} from '@/hooks/alert/useAlertSummaryData';
import SnoozeCell from './alert-summary/SnoozeCell';
import AlertMobileCard from './alert-summary/AlertMobileCard';
import AlertStatsSummary from './alert-summary/AlertStatsSummary';

interface AlertSummaryPageProps {
  stockData?: StockData[];
}

export default function AlertSummaryPage({ stockData = [] }: AlertSummaryPageProps) {
  const {
    alertsData, stats, showSnoozed, setShowSnoozed,
    snoozeLoaded, availableCash,
    snoozedAlerts, snoozeAlert, unsnoozeAlert,
  } = useAlertSummaryData(stockData);

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

  const handleSnooze = (alert: AlertRowData, duration: SnoozeDuration) => {
    snoozeAlert(alert.symbol, alert.alertType, duration, {
      companyName: alert.companyName,
      alertMessage: alert.alertMessage,
      alertDetail: alert.alertDetail,
      currentPrice: alert.currentPrice,
      targetPrice: alert.targetPrice,
      stopLossPrice: alert.stopLossPrice
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSnoozed(!showSnoozed)}
              className={`cursor-pointer px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                showSnoozed ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showSnoozed ? '💤 スヌーズ履歴' : '🔔 アクティブのみ'}
            </button>
            <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
              {showSnoozed ? `${stats.total}件のスヌーズ履歴` : `${stats.total}件（緊急: ${stats.urgent}件）`}
            </div>
          </div>
        </div>

        <AlertStatsSummary stats={stats} />

        {/* デスクトップテーブル */}
        <div className="hidden md:block bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">アラート</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">詳細</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">現在価格</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">対象価格</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">
                  {showSnoozed ? 'スヌーズ状況' : 'スヌーズ'}
                </th>
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
                  <td className="px-4 py-3 text-center text-sm text-gray-300">{alert.alertDetail}</td>
                  <td className="px-4 py-3 text-center text-white">{formatAlertPrice(alert.currentPrice)}円</td>
                  <td className="px-4 py-3 text-center text-white">
                    {alert.targetPrice ? `${formatAlertPrice(alert.targetPrice)}円` :
                     alert.stopLossPrice ? `${formatAlertPrice(alert.stopLossPrice)}円` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <SnoozeCell alert={alert} showSnoozed={showSnoozed} snoozedAlerts={snoozedAlerts} onSnooze={handleSnooze} onUnsnooze={unsnoozeAlert} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モバイルカード */}
        <div className="md:hidden space-y-3">
          {alertsData.map((alert, index) => (
            <AlertMobileCard key={`mobile-${alert.symbol}-${index}`} alert={alert} showSnoozed={showSnoozed} snoozedAlerts={snoozedAlerts} onSnooze={handleSnooze} onUnsnooze={unsnoozeAlert} />
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
