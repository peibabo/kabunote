import { useState, useEffect, useMemo } from 'react';
import { getCompanyNameSync } from '@/data/stockNames';
import { StockData } from '@/hooks/stock/useStockData';
import { useAppEvent } from '@/hooks/util/useAppEvent';
import { APP_EVENTS } from '@/lib/appEvents';
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
  stockDataMap: Map<string, StockData>,
  isInitialized: boolean,
  updateStockPrice: (symbol: string, priceData: { currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }) => void,
  updateStockData: (symbol: string, updates: Partial<StockData>) => void,
  updateStockEvent: (symbol: string, eventType: string, eventData: StockData['events'][0] | null) => void
): UseCalendarDataReturn {
  const [stockCalendarData, setStockCalendarData] = useState<CalendarDataMap>({});

  // カレンダーに関係するフィールドのみの安定キー（price変更では再計算しない）
  const calendarRelevantKey = useMemo(() => {
    return stocks.map(symbol => {
      const s = stockDataMap.get(symbol);
      if (!s) return symbol;
      const events = s.events.map(e => `${e.eventType}:${e.eventDate}:${e.eventMonth}:${e.eventDay}:${e.isRecurring}:${e.isActive}`).join(';');
      const div = s.dividend ? `${s.dividend.rightsMonth}:${s.dividend.rightsDay}` : '';
      const ben = s.benefit ? `${s.benefit.rightsMonth}:${s.benefit.rightsDay}` : '';
      return `${symbol}|${s.name}|${events}|${div}|${ben}`;
    }).join('||');
  }, [stocks, stockDataMap]);

  // カレンダー用データの更新（同期処理）
  useEffect(() => {
    if (!isInitialized || stocks.length === 0) return;

    const calendarData: CalendarDataMap = {};

    for (const symbol of stocks) {
      const dbStock = stockDataMap.get(symbol);

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
        name: dbStock?.name || getCompanyNameSync(symbol) || symbol,
        earningsDate,
        dividendRightsSettings,
        shareholderRightsSettings,
        shareholderMeetingSettings
      };
    }

    setStockCalendarData(calendarData);
  }, [stocks, isInitialized, calendarRelevantKey, stockDataMap]);

  // DB カスタムイベントリスナー
  const listenerOptions = { enabled: isInitialized };

  useAppEvent(APP_EVENTS.DB_CALENDAR_UPDATE, (detail) => {
    if (!detail) return;
    if (detail.type === 'event') {
      updateStockEvent(detail.symbol, detail.eventType, detail.eventData);
    } else if (detail.type === 'dividend') {
      updateStockData(detail.symbol, { dividend: detail.dividend });
    } else if (detail.type === 'benefit') {
      updateStockData(detail.symbol, { benefit: detail.benefit });
    }
  }, listenerOptions);

  useAppEvent(APP_EVENTS.DB_TAG_UPDATE, (detail) => {
    if (detail) updateStockData(detail.symbol, { tags: detail.tags });
  }, listenerOptions);

  useAppEvent(APP_EVENTS.DB_STRATEGY_UPDATE, (detail) => {
    if (detail) updateStockData(detail.symbol, { nextActionPlan: detail.nextActionPlan });
  }, listenerOptions);

  useAppEvent(APP_EVENTS.DB_POSITION_UPDATE, (detail) => {
    if (detail) updateStockData(detail.symbol, { positions: detail.positions });
  }, listenerOptions);

  useAppEvent(APP_EVENTS.DB_PRICE_UPDATE, (detail) => {
    if (detail) updateStockPrice(detail.symbol, detail);
  }, listenerOptions);

  const hasCalendarData = Object.values(stockCalendarData).some(data => {
    return data.earningsDate ||
           (data.dividendRightsSettings.isActive && data.dividendRightsSettings.month && data.dividendRightsSettings.day) ||
           (data.shareholderRightsSettings.isActive && data.shareholderRightsSettings.month && data.shareholderRightsSettings.day) ||
           (data.shareholderMeetingSettings && data.shareholderMeetingSettings.isActive && data.shareholderMeetingSettings.month && data.shareholderMeetingSettings.day);
  });

  return { stockCalendarData, hasCalendarData };
}
