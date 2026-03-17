import { useState, useMemo } from 'react';
import { DividendRightsSettings, ShareholderRightsSettings, ShareholderMeetingSettings } from '@/types/rightsDate';

export interface EventData {
  symbol: string;
  companyName: string;
  eventType: 'earnings' | 'dividend-rights' | 'dividend-final' | 'shareholder-rights' | 'shareholder-final' | 'meeting';
  date: string;
  daysUntil: number;
  icon: string;
  colorClass: string;
  description: string;
}

export type EventSortKey = 'date' | 'symbol' | 'eventType' | 'daysUntil';
export type EventFilterType = 'all' | 'earnings' | 'dividend' | 'shareholder' | 'meeting';

interface StockDataInput {
  [symbol: string]: {
    name: string;
    earningsDate: string;
    dividendRightsSettings: DividendRightsSettings;
    shareholderRightsSettings: ShareholderRightsSettings;
    shareholderMeetingSettings: ShareholderMeetingSettings;
  };
}

function getPreviousBusinessDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  if (result.getDay() === 6) result.setDate(result.getDate() - 1);
  else if (result.getDay() === 0) result.setDate(result.getDate() - 2);
  return result;
}

function calculateDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDisplay(daysUntil: number): string {
  if (daysUntil === 0) return '今日';
  if (daysUntil === 1) return '明日';
  if (daysUntil < 0) return `${Math.abs(daysUntil)}日前`;
  return `${daysUntil}日後`;
}

export const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export function useEventCalendarData(stockSymbols: string[], stockData: StockDataInput) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<EventSortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<EventFilterType>('all');

  // イベントデータを収集
  const eventsData = useMemo(() => {
    const parseDate = (dateStr: string): Date => {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateStr);
      if (dateStr.match(/^\d{2}-\d{2}$/)) return new Date(`${selectedYear}-${dateStr}`);
      return new Date(dateStr);
    };

    const events: EventData[] = [];

    stockSymbols.forEach(symbol => {
      const symbolData = stockData[symbol];
      if (!symbolData) return;

      const companyName = symbolData.name;

      // 決算発表日
      if (symbolData.earningsDate) {
        try {
          const earningsDate = parseDate(symbolData.earningsDate);
          if (!isNaN(earningsDate.getTime()) &&
              earningsDate.getMonth() === selectedMonth &&
              earningsDate.getFullYear() === selectedYear) {
            events.push({
              symbol, companyName, eventType: 'earnings',
              date: earningsDate.toISOString().split('T')[0],
              daysUntil: calculateDaysUntil(earningsDate.toISOString().split('T')[0]),
              icon: '📊', colorClass: 'text-blue-400 bg-blue-900/20', description: '決算発表'
            });
          }
        } catch (error) {
          console.warn(`Failed to parse earnings date for ${symbol}: ${symbolData.earningsDate}`, error);
        }
      }

      // 配当権利確定日関連
      const dividendRights = symbolData.dividendRightsSettings;
      if (dividendRights && dividendRights.isActive && dividendRights.month && dividendRights.day) {
        const rightsDate = new Date(selectedYear, parseInt(dividendRights.month.toString()) - 1, parseInt(dividendRights.day.toString()));
        if (rightsDate.getMonth() === selectedMonth && rightsDate.getFullYear() === selectedYear) {
          events.push({
            symbol, companyName, eventType: 'dividend-rights',
            date: rightsDate.toISOString().split('T')[0],
            daysUntil: calculateDaysUntil(rightsDate.toISOString().split('T')[0]),
            icon: '💰', colorClass: 'text-green-400 bg-green-900/20', description: '配当権利確定日'
          });

          const finalDate = getPreviousBusinessDay(rightsDate);
          if (finalDate.getMonth() === selectedMonth && finalDate.getFullYear() === selectedYear) {
            events.push({
              symbol, companyName, eventType: 'dividend-final',
              date: finalDate.toISOString().split('T')[0],
              daysUntil: calculateDaysUntil(finalDate.toISOString().split('T')[0]),
              icon: '🏦', colorClass: 'text-green-300 bg-green-800/20', description: '配当権利付き最終日'
            });
          }
        }
      }

      // 優待権利確定日関連
      const shareholderRights = symbolData.shareholderRightsSettings;
      if (shareholderRights && shareholderRights.isActive && shareholderRights.month && shareholderRights.day) {
        const rightsDate = new Date(selectedYear, parseInt(shareholderRights.month.toString()) - 1, parseInt(shareholderRights.day.toString()));
        if (rightsDate.getMonth() === selectedMonth && rightsDate.getFullYear() === selectedYear) {
          events.push({
            symbol, companyName, eventType: 'shareholder-rights',
            date: rightsDate.toISOString().split('T')[0],
            daysUntil: calculateDaysUntil(rightsDate.toISOString().split('T')[0]),
            icon: '🎁', colorClass: 'text-purple-400 bg-purple-900/20', description: '優待権利確定日'
          });

          const finalDate = getPreviousBusinessDay(rightsDate);
          if (finalDate.getMonth() === selectedMonth && finalDate.getFullYear() === selectedYear) {
            events.push({
              symbol, companyName, eventType: 'shareholder-final',
              date: finalDate.toISOString().split('T')[0],
              daysUntil: calculateDaysUntil(finalDate.toISOString().split('T')[0]),
              icon: '🛍️', colorClass: 'text-purple-300 bg-purple-800/20', description: '優待権利付き最終日'
            });
          }
        }
      }

      // 株主総会
      const meeting = symbolData.shareholderMeetingSettings;
      if (meeting && meeting.isActive && meeting.month && meeting.day) {
        const meetingDate = new Date(selectedYear, parseInt(meeting.month.toString()) - 1, parseInt(meeting.day.toString()));
        if (meetingDate.getMonth() === selectedMonth && meetingDate.getFullYear() === selectedYear) {
          events.push({
            symbol, companyName, eventType: 'meeting',
            date: meetingDate.toISOString().split('T')[0],
            daysUntil: calculateDaysUntil(meetingDate.toISOString().split('T')[0]),
            icon: '🏢', colorClass: 'text-orange-400 bg-orange-900/20', description: '株主総会'
          });
        }
      }
    });

    return events;
  }, [stockSymbols, stockData, selectedMonth, selectedYear]);

  // フィルター処理
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return eventsData;
    switch (filterType) {
      case 'earnings': return eventsData.filter(e => e.eventType === 'earnings');
      case 'dividend': return eventsData.filter(e => e.eventType.includes('dividend'));
      case 'shareholder': return eventsData.filter(e => e.eventType.includes('shareholder'));
      case 'meeting': return eventsData.filter(e => e.eventType === 'meeting');
      default: return eventsData;
    }
  }, [eventsData, filterType]);

  // ソート処理
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date': comparison = new Date(a.date).getTime() - new Date(b.date).getTime(); break;
        case 'symbol': comparison = a.symbol.localeCompare(b.symbol); break;
        case 'eventType': comparison = a.eventType.localeCompare(b.eventType); break;
        case 'daysUntil': comparison = a.daysUntil - b.daysUntil; break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredEvents, sortBy, sortOrder]);

  const handleSort = (key: EventSortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1); }
      else { setSelectedMonth(selectedMonth + 1); }
    } else {
      if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1); }
      else { setSelectedMonth(selectedMonth - 1); }
    }
  };

  return {
    selectedMonth, selectedYear,
    sortBy, sortOrder, filterType, setFilterType,
    sortedEvents, handleSort, changeMonth,
  };
}
