import { useMemo, useState, useEffect, useCallback } from 'react';
import { StockData } from '@/hooks/useStockData';
import { CalendarDataMap } from '@/hooks/useCalendarData';
import { SnoozedAlert } from '@/types/snooze';
import {
  extractUpcomingEvents,
  extractActiveAlerts,
  extractHighPriorityActions,
  calculatePortfolioHighlight,
  DailyDigestData,
} from '@/lib/dailyDigestCalc';

export function useDailyDigest(
  stockData: StockData[],
  stockCalendarData: CalendarDataMap,
  cashAmount: string,
  isInitialized: boolean
): DailyDigestData {
  const [snoozedAlerts, setSnoozedAlerts] = useState<SnoozedAlert[]>([]);

  // スヌーズ状態をlocalStorageから読み込み
  const loadSnoozedAlerts = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('kabunote-snoozed-alerts');
      if (stored) {
        setSnoozedAlerts(JSON.parse(stored));
      } else {
        setSnoozedAlerts([]);
      }
    } catch {
      setSnoozedAlerts([]);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    loadSnoozedAlerts();

    const handleStorageChange = (event: CustomEvent) => {
      const { key } = event.detail;
      if (key === 'kabunote-snoozed-alerts') {
        setTimeout(() => loadSnoozedAlerts(), 100);
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange as EventListener);
    };
  }, [isInitialized, loadSnoozedAlerts]);

  const digest = useMemo<DailyDigestData>(() => {
    if (!isInitialized || stockData.length === 0) {
      return { events: [], alerts: [], actions: [], portfolio: null, hasAnyData: false };
    }

    const events = extractUpcomingEvents(stockCalendarData, 7);
    const alerts = extractActiveAlerts(stockData, cashAmount, snoozedAlerts);
    const actions = extractHighPriorityActions(stockData, cashAmount);
    const portfolio = calculatePortfolioHighlight(stockData);

    const hasAnyData = events.length > 0 || alerts.length > 0 || actions.length > 0 || portfolio !== null;

    return { events, alerts, actions, portfolio, hasAnyData };
  }, [stockData, stockCalendarData, cashAmount, isInitialized, snoozedAlerts]);

  return digest;
}
