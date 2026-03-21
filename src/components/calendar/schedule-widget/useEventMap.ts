import { useMemo } from 'react';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { EventSummary, InvestmentEvent } from '@/types/investmentCalendar';
import { formatDateString, calculateFullDateFromMonthDay, calculateBusinessDaysBefore } from '@/lib/investmentCalendarCalc';
import { calculateDaysUntil } from './eventUtils';

// eventMap生成（InvestmentCalendar.tsxから移植）
export function useEventMap(stockCalendarData: CalendarDataMap): EventSummary {
  return useMemo(() => {
    const events: EventSummary = {};

    for (const [symbol, data] of Object.entries(stockCalendarData)) {
      // 決算発表日
      if (data.earningsDate) {
        const dateKey = data.earningsDate;
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          id: `${symbol}-earnings`, symbol, companyName: data.name,
          date: dateKey, type: 'earnings', title: '決算発表',
        });
      }

      // 配当権利確定日と権利付き最終日
      if (data.dividendRightsSettings.isActive && data.dividendRightsSettings.month && data.dividendRightsSettings.day) {
        const rightsDate = calculateFullDateFromMonthDay(data.dividendRightsSettings.month, data.dividendRightsSettings.day, data.dividendRightsSettings.isRecurring);
        const dateKey = formatDateString(rightsDate);
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          id: `${symbol}-dividend-rights-confirmation`, symbol, companyName: data.name,
          date: dateKey, type: 'dividend-rights-confirmation', title: '配当権利確定',
          isRecurring: data.dividendRightsSettings.isRecurring,
        });
        const lastDate = calculateBusinessDaysBefore(rightsDate, 2);
        const lastDateKey = formatDateString(lastDate);
        if (!events[lastDateKey]) events[lastDateKey] = [];
        events[lastDateKey].push({
          id: `${symbol}-dividend-rights-last`, symbol, companyName: data.name,
          date: lastDateKey, type: 'dividend-rights-last', title: '配当権利付き最終日',
          isRecurring: data.dividendRightsSettings.isRecurring,
        });
      }

      // 優待権利確定日と権利付き最終日
      if (data.shareholderRightsSettings.isActive && data.shareholderRightsSettings.month && data.shareholderRightsSettings.day) {
        const rightsDate = calculateFullDateFromMonthDay(data.shareholderRightsSettings.month, data.shareholderRightsSettings.day, data.shareholderRightsSettings.isRecurring);
        const dateKey = formatDateString(rightsDate);
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          id: `${symbol}-shareholder-rights-confirmation`, symbol, companyName: data.name,
          date: dateKey, type: 'shareholder-rights-confirmation', title: '優待権利確定',
          isRecurring: data.shareholderRightsSettings.isRecurring,
        });
        const lastDate = calculateBusinessDaysBefore(rightsDate, 2);
        const lastDateKey = formatDateString(lastDate);
        if (!events[lastDateKey]) events[lastDateKey] = [];
        events[lastDateKey].push({
          id: `${symbol}-shareholder-rights-last`, symbol, companyName: data.name,
          date: lastDateKey, type: 'shareholder-rights-last', title: '優待権利付き最終日',
          isRecurring: data.shareholderRightsSettings.isRecurring,
        });
      }

      // 株主総会日
      if (data.shareholderMeetingSettings?.isActive && data.shareholderMeetingSettings.month && data.shareholderMeetingSettings.day) {
        const meetingDate = calculateFullDateFromMonthDay(data.shareholderMeetingSettings.month, data.shareholderMeetingSettings.day, data.shareholderMeetingSettings.isRecurring);
        const dateKey = formatDateString(meetingDate);
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          id: `${symbol}-shareholder-meeting`, symbol, companyName: data.name,
          date: dateKey, type: 'shareholder-meeting', title: '株主総会',
          isRecurring: data.shareholderMeetingSettings.isRecurring,
        });
      }
    }

    return events;
  }, [stockCalendarData]);
}

// 直近イベントリスト（未来7日以内のイベントを日付順にフラット化）
export interface UpcomingEvent {
  event: InvestmentEvent;
  daysUntil: number;
}

export function useUpcomingEvents(eventMap: EventSummary): UpcomingEvent[] {
  return useMemo(() => {
    const upcoming: UpcomingEvent[] = [];

    for (const [dateStr, events] of Object.entries(eventMap)) {
      const days = calculateDaysUntil(dateStr);
      if (days < 0 || days > 7) continue;
      for (const event of events) {
        upcoming.push({ event, daysUntil: days });
      }
    }

    return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [eventMap]);
}
