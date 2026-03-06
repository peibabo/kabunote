import { useState, useEffect } from 'react';
import { loadStockData, getStockData } from '@/data/stockNames';
import { StockData } from '@/hooks/useStockData';
import {
  DividendRightsSettings,
  ShareholderRightsSettings,
  ShareholderMeetingSettings,
  createDefaultRightsSettings,
} from '@/types/rightsDate';

export type CalendarDataMap = {
  [symbol: string]: {
    name: string;
    earningsDate: string;
    dividendRightsSettings: DividendRightsSettings;
    shareholderRightsSettings: ShareholderRightsSettings;
    shareholderMeetingSettings: ShareholderMeetingSettings;
  };
};

interface UseCalendarDataReturn {
  stockCalendarData: CalendarDataMap;
  hasCalendarData: boolean;
}

export function useCalendarData(
  stocks: string[],
  stockData: StockData[],
  isInitialized: boolean,
  updateStockPrice: (symbol: string, priceData: { currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }) => void,
  updateStockData: (symbol: string, updates: Partial<StockData>) => void,
  updateStockEvent: (symbol: string, eventType: string, eventData: StockData['events'][0] | null) => void
): UseCalendarDataReturn {
  const [stockCalendarData, setStockCalendarData] = useState<CalendarDataMap>({});

  // カレンダー用データの更新
  useEffect(() => {
    const updateCalendarData = async () => {
      if (!isInitialized || stocks.length === 0) return;

      const calendarData: CalendarDataMap = {};

      await loadStockData();

      for (const symbol of stocks) {
        const stockInfo = await getStockData(symbol);
        const dbStock = stockData.find(s => s.symbol === symbol);

        const earningsEvent = dbStock?.events?.find(e => e.eventType === 'EARNINGS');
        const earningsDate = earningsEvent?.eventDate || '';

        const dividendRightsSettings: DividendRightsSettings =
          dbStock?.dividend?.rightsMonth && dbStock.dividend.rightsDay
            ? { month: dbStock.dividend.rightsMonth, day: dbStock.dividend.rightsDay, isRecurring: true, isActive: true }
            : createDefaultRightsSettings();

        const shareholderRightsSettings: ShareholderRightsSettings =
          dbStock?.benefit?.rightsMonth && dbStock.benefit.rightsDay
            ? { month: dbStock.benefit.rightsMonth, day: dbStock.benefit.rightsDay, isRecurring: true, isActive: true }
            : createDefaultRightsSettings();

        const meetingEvent = dbStock?.events?.find(e => e.eventType === 'SHAREHOLDER_MEETING');
        const shareholderMeetingSettings: ShareholderMeetingSettings = meetingEvent
          ? { month: meetingEvent.eventMonth, day: meetingEvent.eventDay, isRecurring: meetingEvent.isRecurring, isActive: meetingEvent.isActive }
          : createDefaultRightsSettings();

        calendarData[symbol] = {
          name: dbStock?.name || stockInfo?.name || symbol,
          earningsDate,
          dividendRightsSettings,
          shareholderRightsSettings,
          shareholderMeetingSettings
        };
      }

      setStockCalendarData(calendarData);
    };

    updateCalendarData();
  }, [stocks, isInitialized, stockData]);

  // DB カスタムイベントリスナー
  useEffect(() => {
    if (!isInitialized) return;

    const handleDbCalendarUpdate = (e: Event) => {
      const ev = e as CustomEvent<{ type: 'event' | 'dividend' | 'benefit'; symbol: string; [key: string]: unknown }>;
      if (!ev.detail) return;
      const { type, symbol } = ev.detail;
      if (type === 'event') {
        updateStockEvent(symbol, ev.detail.eventType as string, ev.detail.eventData as StockData['events'][0] | null);
      } else if (type === 'dividend') {
        updateStockData(symbol, { dividend: ev.detail.dividend as StockData['dividend'] });
      } else if (type === 'benefit') {
        updateStockData(symbol, { benefit: ev.detail.benefit as StockData['benefit'] });
      }
    };
    window.addEventListener('kabunote-db-calendar-update', handleDbCalendarUpdate);

    const handleDbTagUpdate = (e: Event) => {
      const ev = e as CustomEvent<{ symbol: string; tags: StockData['tags'] }>;
      if (ev.detail) updateStockData(ev.detail.symbol, { tags: ev.detail.tags });
    };
    window.addEventListener('kabunote-db-tag-update', handleDbTagUpdate);

    const handleDbStrategyUpdate = (e: Event) => {
      const ev = e as CustomEvent<{ symbol: string; nextActionPlan: StockData['nextActionPlan'] }>;
      if (ev.detail) updateStockData(ev.detail.symbol, { nextActionPlan: ev.detail.nextActionPlan });
    };
    window.addEventListener('kabunote-db-strategy-update', handleDbStrategyUpdate);

    const handleDbPositionUpdate = (e: Event) => {
      const ev = e as CustomEvent<{ symbol: string; positions: StockData['positions'] }>;
      if (ev.detail) updateStockData(ev.detail.symbol, { positions: ev.detail.positions });
    };
    window.addEventListener('kabunote-db-position-update', handleDbPositionUpdate);

    const handleDbPriceUpdate = (e: Event) => {
      const event = e as CustomEvent<{
        symbol: string;
        currentPrice: number | null;
        targetPrice: number | null;
        stopLossPrice: number | null;
      }>;
      if (event.detail) {
        updateStockPrice(event.detail.symbol, event.detail);
      }
    };
    window.addEventListener('kabunote-db-price-update', handleDbPriceUpdate);

    return () => {
      window.removeEventListener('kabunote-db-calendar-update', handleDbCalendarUpdate);
      window.removeEventListener('kabunote-db-tag-update', handleDbTagUpdate);
      window.removeEventListener('kabunote-db-strategy-update', handleDbStrategyUpdate);
      window.removeEventListener('kabunote-db-position-update', handleDbPositionUpdate);
      window.removeEventListener('kabunote-db-price-update', handleDbPriceUpdate);
    };
  }, [isInitialized, updateStockPrice, updateStockData, updateStockEvent]);

  const hasCalendarData = Object.values(stockCalendarData).some(data => {
    return data.earningsDate ||
           (data.dividendRightsSettings.isActive && data.dividendRightsSettings.month && data.dividendRightsSettings.day) ||
           (data.shareholderRightsSettings.isActive && data.shareholderRightsSettings.month && data.shareholderRightsSettings.day) ||
           (data.shareholderMeetingSettings && data.shareholderMeetingSettings.isActive && data.shareholderMeetingSettings.month && data.shareholderMeetingSettings.day);
  });

  return { stockCalendarData, hasCalendarData };
}
