import { useState, useEffect, useCallback } from 'react';
import { StockData } from '@/hooks/useStockData';
import { NextActionPlan } from '@/types/nextActionPlan';
import { SnoozedAlert } from '@/types/snooze';
import { getAllActiveAlerts } from '@/utils/alertSystem';
import { calculatePositionSummary } from '@/types/positions';

interface AlertCounts {
  total: number;
  urgent: number;
}

export function useAlertCounts(
  stocks: string[],
  stockData: StockData[],
  isInitialized: boolean,
  cashAmount: string
): { alertCounts: AlertCounts } {
  const [alertCounts, setAlertCounts] = useState<AlertCounts>({ total: 0, urgent: 0 });

  const calculateAlertCounts = useCallback((): AlertCounts => {
    if (!isInitialized || stocks.length === 0) {
      return { total: 0, urgent: 0 };
    }

    const availableCash = parseFloat(cashAmount) || 0;

    let totalAlerts = 0;
    let urgentAlerts = 0;

    const checkSnooze = (symbol: string, alertType: string): boolean => {
      const snoozedAlertsStr = typeof window !== 'undefined' ? localStorage.getItem('kabunote-snoozed-alerts') : null;
      if (!snoozedAlertsStr) return false;
      try {
        const snoozedAlerts = JSON.parse(snoozedAlertsStr);
        const alertKey = `${symbol}-${alertType}`;
        return snoozedAlerts.some((s: SnoozedAlert) => s.alertKey === alertKey && s.snoozeUntil > Date.now());
      } catch { return false; }
    };

    const countAlerts = (symbol: string, currentPrice: number, targetPrice: number, stopLossPrice: number, plan: NextActionPlan, positionSummary: ReturnType<typeof calculatePositionSummary> | null) => {
      const alerts = getAllActiveAlerts(
        plan, currentPrice, targetPrice, stopLossPrice.toString(),
        positionSummary && positionSummary.totalShares > 0 ? positionSummary : undefined,
        availableCash
      );

      alerts.forEach(alert => {
        if (!checkSnooze(symbol, alert.type)) {
          totalAlerts++;
          if (alert.type === 'insufficient-funds' || alert.type === 'stop-loss-exceeded' || alert.type === 'nextaction-approaching') {
            urgentAlerts++;
          }
        }
      });
    };

    stockData.forEach(stock => {
      const currentPrice = stock.currentPrice ?? 0;
      if (currentPrice <= 0) return;

      const targetPrice = stock.targetPrice ?? 0;
      const stopLossPrice = stock.stopLossPrice ?? 0;

      const nap = stock.nextActionPlan;
      const plan: NextActionPlan = nap ? {
        id: 'db',
        actionType: nap.actionType as 'buy' | 'sell' | 'hold',
        priority: nap.priority as 'high' | 'medium' | 'low',
        targetPrice: nap.targetPrice ?? 0,
        targetQuantity: nap.targetShares ?? 0,
        memo: nap.strategyMemo,
        updatedAt: '',
      } : { id: '', targetPrice: 0, targetQuantity: 0, memo: '', actionType: 'buy', priority: 'medium', updatedAt: '' };

      const positionSummary = stock.positions.length > 0 ? calculatePositionSummary(stock.positions) : null;

      countAlerts(stock.symbol, currentPrice, targetPrice, stopLossPrice, plan, positionSummary);
    });

    return { total: totalAlerts, urgent: urgentAlerts };
  }, [stocks, isInitialized, stockData, cashAmount]);

  useEffect(() => {
    const counts = calculateAlertCounts();
    setAlertCounts(counts);
  }, [calculateAlertCounts]);

  // スヌーズ変更監視（localStorageのスヌーズ状態変更でアラートを再計算）
  useEffect(() => {
    if (!isInitialized) return;

    const handleStorageChange = (event: CustomEvent) => {
      const { key } = event.detail;
      if (key === 'kabunote-snoozed-alerts') {
        setTimeout(() => {
          const counts = calculateAlertCounts();
          setAlertCounts(counts);
        }, 100);
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [isInitialized, calculateAlertCounts]);

  return { alertCounts };
}
