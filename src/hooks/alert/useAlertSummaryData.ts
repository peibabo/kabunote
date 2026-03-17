import { useState, useMemo } from 'react';
import { NextActionPlan, NextActionPlanAnalysis } from '@/types/nextActionPlan';
import { getAllActiveAlerts, AlertType } from '@/utils/alertSystem';
import { getCompanyNameSync } from '@/data/stockNames';
import { calculatePositionSummary } from '@/lib/positionCalc';
import { useSnooze } from '@/hooks/alert/useSnooze';
import { useCash } from '@/hooks/auth/useCash';
import { StockData } from '@/hooks/stock/useStockData';

export interface AlertRowData {
  symbol: string;
  companyName: string;
  alertType: AlertType;
  alertMessage: string;
  alertDetail: string;
  priority: number;
  gapPercentage?: number;
  currentPrice: number;
  targetPrice?: number;
  stopLossPrice?: number;
}

export interface AlertStats {
  total: number;
  urgent: number;
  byType: Record<AlertType, number>;
}

// アラート表示情報を取得
export function getAlertDisplayInfo(alert: { type: AlertType; gapPercentage?: number; analysis?: NextActionPlanAnalysis; targetPrice?: number; stopLossPrice?: number }) {
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
}

// アラート種別に応じたスタイル
export function getAlertStyles(alertType: AlertType): string {
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
}

export function formatAlertPrice(price: number): string {
  return new Intl.NumberFormat('ja-JP').format(Math.round(price));
}

export function useAlertSummaryData(stockData: StockData[]) {
  const { cashAmount } = useCash();
  const availableCash = parseFloat(cashAmount) || 0;
  const [showSnoozed, setShowSnoozed] = useState(false);

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

  // アラートデータを収集
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

  // 統計情報
  const stats = useMemo<AlertStats>(() => {
    const total = alertsData.length;
    const urgent = alertsData.filter(a => a.priority <= 2).length;
    const byType = alertsData.reduce((acc, alert) => {
      acc[alert.alertType] = (acc[alert.alertType] || 0) + 1;
      return acc;
    }, {} as Record<AlertType, number>);

    return { total, urgent, byType };
  }, [alertsData]);

  return {
    alertsData,
    stats,
    showSnoozed,
    setShowSnoozed,
    snoozeLoaded,
    availableCash,
    snoozedAlerts,
    snoozeAlert,
    unsnoozeAlert,
  };
}
