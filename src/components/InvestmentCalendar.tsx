'use client';

import { useMemo } from 'react';
import {
  EventSummary,
  formatDateString,
  calculateFullDateFromMonthDay
} from '@/types/investmentCalendar';
import { DividendRightsSettings, ShareholderRightsSettings, ShareholderMeetingSettings } from '@/types/rightsDate';
import TodayTomorrowEvents from './TodayTomorrowEvents';
import InvestmentTimeline from './InvestmentTimeline';

// 土日を除いた営業日前を計算する関数
const calculateBusinessDaysBefore = (date: Date, businessDays: number): Date => {
  const result = new Date(date);
  let remainingDays = businessDays;

  while (remainingDays > 0) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    // 土曜日(6)と日曜日(0)以外の場合にカウント
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }

  return result;
};

interface InvestmentCalendarProps {
  stockSymbols: string[];
  stockData: {
    [symbol: string]: {
      name: string;
      earningsDate: string;
      dividendRightsSettings: DividendRightsSettings;
      shareholderRightsSettings: ShareholderRightsSettings;
      shareholderMeetingSettings: ShareholderMeetingSettings;
    }
  };
  onStockClick: (symbol: string) => void;
}

export default function InvestmentCalendar({ stockSymbols, stockData, onStockClick }: InvestmentCalendarProps) {

  // 投資イベントマップを生成（パフォーマンス最適化）
  const eventMap = useMemo<EventSummary>(() => {
    const events: EventSummary = {};

    stockSymbols.forEach(symbol => {
      const data = stockData[symbol];
      if (!data) return;

      // 決算発表日
      if (data.earningsDate) {
        const dateKey = data.earningsDate;
        if (!events[dateKey]) events[dateKey] = [];
        events[dateKey].push({
          id: `${symbol}-earnings`,
          symbol,
          companyName: data.name,
          date: dateKey,
          type: 'earnings',
          title: '決算発表'
        });
      }

      // 配当権利確定日と権利付き最終日
      if (data.dividendRightsSettings.isActive && data.dividendRightsSettings.month && data.dividendRightsSettings.day) {
        const dividendRightsDate = calculateFullDateFromMonthDay(
          data.dividendRightsSettings.month,
          data.dividendRightsSettings.day,
          data.dividendRightsSettings.isRecurring
        );
        const dividendRightsDateKey = formatDateString(dividendRightsDate);

        // 配当権利確定日
        if (!events[dividendRightsDateKey]) events[dividendRightsDateKey] = [];
        events[dividendRightsDateKey].push({
          id: `${symbol}-dividend-rights-confirmation`,
          symbol,
          companyName: data.name,
          date: dividendRightsDateKey,
          type: 'dividend-rights-confirmation',
          title: '配当権利確定',
          isRecurring: data.dividendRightsSettings.isRecurring
        });

        // 配当権利付き最終日
        const dividendLastDate = calculateBusinessDaysBefore(dividendRightsDate, 2);
        const dividendLastDateKey = formatDateString(dividendLastDate);
        if (!events[dividendLastDateKey]) events[dividendLastDateKey] = [];
        events[dividendLastDateKey].push({
          id: `${symbol}-dividend-rights-last`,
          symbol,
          companyName: data.name,
          date: dividendLastDateKey,
          type: 'dividend-rights-last',
          title: '配当権利付き最終日',
          isRecurring: data.dividendRightsSettings.isRecurring
        });
      }

      // 株主優待権利確定日と権利付き最終日
      if (data.shareholderRightsSettings.isActive && data.shareholderRightsSettings.month && data.shareholderRightsSettings.day) {
        const shareholderRightsDate = calculateFullDateFromMonthDay(
          data.shareholderRightsSettings.month,
          data.shareholderRightsSettings.day,
          data.shareholderRightsSettings.isRecurring
        );
        const shareholderRightsDateKey = formatDateString(shareholderRightsDate);

        // 株主優待権利確定日
        if (!events[shareholderRightsDateKey]) events[shareholderRightsDateKey] = [];
        events[shareholderRightsDateKey].push({
          id: `${symbol}-shareholder-rights-confirmation`,
          symbol,
          companyName: data.name,
          date: shareholderRightsDateKey,
          type: 'shareholder-rights-confirmation',
          title: '優待権利確定',
          isRecurring: data.shareholderRightsSettings.isRecurring
        });

        // 株主優待権利付き最終日
        const shareholderLastDate = calculateBusinessDaysBefore(shareholderRightsDate, 2);
        const shareholderLastDateKey = formatDateString(shareholderLastDate);
        if (!events[shareholderLastDateKey]) events[shareholderLastDateKey] = [];
        events[shareholderLastDateKey].push({
          id: `${symbol}-shareholder-rights-last`,
          symbol,
          companyName: data.name,
          date: shareholderLastDateKey,
          type: 'shareholder-rights-last',
          title: '優待権利付き最終日',
          isRecurring: data.shareholderRightsSettings.isRecurring
        });
      }

      // 株主総会日
      if (data.shareholderMeetingSettings.isActive && data.shareholderMeetingSettings.month && data.shareholderMeetingSettings.day) {
        const shareholderMeetingDate = calculateFullDateFromMonthDay(
          data.shareholderMeetingSettings.month,
          data.shareholderMeetingSettings.day,
          data.shareholderMeetingSettings.isRecurring
        );
        const shareholderMeetingDateKey = formatDateString(shareholderMeetingDate);

        // 株主総会日
        if (!events[shareholderMeetingDateKey]) events[shareholderMeetingDateKey] = [];
        events[shareholderMeetingDateKey].push({
          id: `${symbol}-shareholder-meeting`,
          symbol,
          companyName: data.name,
          date: shareholderMeetingDateKey,
          type: 'shareholder-meeting',
          title: '株主総会',
          isRecurring: data.shareholderMeetingSettings.isRecurring
        });
      }
    });

    return events;
  }, [stockSymbols, stockData]);

  return (
    <div className="font-thin">
      {/* 今日・明日の予定表示 */}
      <TodayTomorrowEvents events={eventMap} onStockClick={onStockClick} />

      {/* 投資タイムライン（月間カレンダーアコーディオン含む） */}
      <div className="mb-6">
        <InvestmentTimeline
          events={eventMap}
          onStockClick={onStockClick}
        />
      </div>
    </div>
  );
}