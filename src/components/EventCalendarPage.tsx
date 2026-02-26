'use client';

import React, { useState, useMemo } from 'react';
import { DividendRightsSettings, ShareholderRightsSettings, ShareholderMeetingSettings } from '@/types/rightsDate';

interface EventData {
  symbol: string;
  companyName: string;
  eventType: 'earnings' | 'dividend-rights' | 'dividend-final' | 'shareholder-rights' | 'shareholder-final' | 'meeting';
  date: string;
  daysUntil: number;
  icon: string;
  colorClass: string;
  description: string;
}

type SortKey = 'date' | 'symbol' | 'eventType' | 'daysUntil';
type FilterType = 'all' | 'earnings' | 'dividend' | 'shareholder' | 'meeting';

interface EventCalendarPageProps {
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
}

export default function EventCalendarPage({ stockSymbols, stockData }: EventCalendarPageProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // 営業日計算関数
  const getPreviousBusinessDay = (date: Date): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() - 1);

    // 土曜日(6)なら金曜日に、日曜日(0)なら金曜日に調整
    if (result.getDay() === 6) { // 土曜日
      result.setDate(result.getDate() - 1);
    } else if (result.getDay() === 0) { // 日曜日
      result.setDate(result.getDate() - 2);
    }

    return result;
  };

  // 日数差を計算
  const calculateDaysUntil = (dateStr: string): number => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 日付形式を統一して解析する関数
  const parseDate = (dateStr: string): Date => {
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // 完全な日付形式 (YYYY-MM-DD) の場合
      return new Date(dateStr);
    } else if (dateStr.match(/^\d{2}-\d{2}$/)) {
      // 月日のみ形式 (MM-DD) の場合
      return new Date(`${selectedYear}-${dateStr}`);
    } else {
      // その他の形式
      return new Date(dateStr);
    }
  };

  // イベントデータを収集
  const eventsData = useMemo(() => {
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
              symbol,
              companyName,
              eventType: 'earnings',
              date: earningsDate.toISOString().split('T')[0],
              daysUntil: calculateDaysUntil(earningsDate.toISOString().split('T')[0]),
              icon: '📊',
              colorClass: 'text-blue-400 bg-blue-900/20',
              description: '決算発表'
            });
          }
        } catch (error) {
          console.warn(`Failed to parse earnings date for ${symbol}: ${symbolData.earningsDate}`, error);
        }
      }

      // 配当権利確定日関連
      const dividendRights = symbolData.dividendRightsSettings;
      if (dividendRights && dividendRights.isActive && dividendRights.month && dividendRights.day) {
        const rightsDate = new Date(selectedYear, parseInt(dividendRights.month) - 1, parseInt(dividendRights.day));
        if (rightsDate.getMonth() === selectedMonth && rightsDate.getFullYear() === selectedYear) {
          // 権利確定日
          events.push({
            symbol,
            companyName,
            eventType: 'dividend-rights',
            date: rightsDate.toISOString().split('T')[0],
            daysUntil: calculateDaysUntil(rightsDate.toISOString().split('T')[0]),
            icon: '💰',
            colorClass: 'text-green-400 bg-green-900/20',
            description: '配当権利確定日'
          });

          // 権利付き最終日
          const finalDate = getPreviousBusinessDay(rightsDate);
          if (finalDate.getMonth() === selectedMonth && finalDate.getFullYear() === selectedYear) {
            events.push({
              symbol,
              companyName,
              eventType: 'dividend-final',
              date: finalDate.toISOString().split('T')[0],
              daysUntil: calculateDaysUntil(finalDate.toISOString().split('T')[0]),
              icon: '🏦',
              colorClass: 'text-green-300 bg-green-800/20',
              description: '配当権利付き最終日'
            });
          }
        }
      }

      // 優待権利確定日関連
      const shareholderRights = symbolData.shareholderRightsSettings;
      if (shareholderRights && shareholderRights.isActive && shareholderRights.month && shareholderRights.day) {
        const rightsDate = new Date(selectedYear, parseInt(shareholderRights.month) - 1, parseInt(shareholderRights.day));
        if (rightsDate.getMonth() === selectedMonth && rightsDate.getFullYear() === selectedYear) {
          // 権利確定日
          events.push({
            symbol,
            companyName,
            eventType: 'shareholder-rights',
            date: rightsDate.toISOString().split('T')[0],
            daysUntil: calculateDaysUntil(rightsDate.toISOString().split('T')[0]),
            icon: '🎁',
            colorClass: 'text-purple-400 bg-purple-900/20',
            description: '優待権利確定日'
          });

          // 権利付き最終日
          const finalDate = getPreviousBusinessDay(rightsDate);
          if (finalDate.getMonth() === selectedMonth && finalDate.getFullYear() === selectedYear) {
            events.push({
              symbol,
              companyName,
              eventType: 'shareholder-final',
              date: finalDate.toISOString().split('T')[0],
              daysUntil: calculateDaysUntil(finalDate.toISOString().split('T')[0]),
              icon: '🛍️',
              colorClass: 'text-purple-300 bg-purple-800/20',
              description: '優待権利付き最終日'
            });
          }
        }
      }

      // 株主総会
      const meeting = symbolData.shareholderMeetingSettings;
      if (meeting && meeting.isActive && meeting.month && meeting.day) {
        const meetingDate = new Date(selectedYear, parseInt(meeting.month) - 1, parseInt(meeting.day));
        if (meetingDate.getMonth() === selectedMonth && meetingDate.getFullYear() === selectedYear) {
          events.push({
            symbol,
            companyName,
            eventType: 'meeting',
            date: meetingDate.toISOString().split('T')[0],
            daysUntil: calculateDaysUntil(meetingDate.toISOString().split('T')[0]),
            icon: '🏢',
            colorClass: 'text-orange-400 bg-orange-900/20',
            description: '株主総会'
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
      case 'earnings':
        return eventsData.filter(event => event.eventType === 'earnings');
      case 'dividend':
        return eventsData.filter(event => event.eventType.includes('dividend'));
      case 'shareholder':
        return eventsData.filter(event => event.eventType.includes('shareholder'));
      case 'meeting':
        return eventsData.filter(event => event.eventType === 'meeting');
      default:
        return eventsData;
    }
  }, [eventsData, filterType]);

  // ソート処理
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'eventType':
          comparison = a.eventType.localeCompare(b.eventType);
          break;
        case 'daysUntil':
          comparison = a.daysUntil - b.daysUntil;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [filteredEvents, sortBy, sortOrder]);

  // ソート変更ハンドラー
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // 月変更
  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'next') {
      if (selectedMonth === 11) {
        setSelectedMonth(0);
        setSelectedYear(selectedYear + 1);
      } else {
        setSelectedMonth(selectedMonth + 1);
      }
    } else {
      if (selectedMonth === 0) {
        setSelectedMonth(11);
        setSelectedYear(selectedYear - 1);
      } else {
        setSelectedMonth(selectedMonth - 1);
      }
    }
  };

  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  // 日付フォーマット
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 日数表示
  const getDaysUntilDisplay = (daysUntil: number) => {
    if (daysUntil === 0) return '今日';
    if (daysUntil === 1) return '明日';
    if (daysUntil < 0) return `${Math.abs(daysUntil)}日前`;
    return `${daysUntil}日後`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📅 イベント一覧</h1>

        {/* 月ナビゲーション（統一位置） */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={() => changeMonth('prev')}
            className="cursor-pointer p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← 前月
          </button>
          <h2 className="text-xl font-semibold">{selectedYear}年 {monthNames[selectedMonth]}</h2>
          <button
            onClick={() => changeMonth('next')}
            className="cursor-pointer p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            次月 →
          </button>
        </div>

        {sortedEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">📅 この月にはイベントがありません</div>
            <div className="text-sm text-gray-500">
              決算発表日・配当権利確定日・優待権利確定日・株主総会の設定がある場合に表示されます
            </div>
          </div>
        ) : (
          <>
            {/* フィルター（常に表示） */}
            <div className="flex justify-center gap-2 mb-6">
              {[
                { key: 'all' as FilterType, label: '全て' },
                { key: 'earnings' as FilterType, label: '決算' },
                { key: 'dividend' as FilterType, label: '配当' },
                { key: 'shareholder' as FilterType, label: '優待' },
                { key: 'meeting' as FilterType, label: '総会' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                    filterType === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* ソートボタン */}
            <div className="flex gap-2 mb-6">
              <span className="text-sm text-gray-400 self-center mr-2">並び替え:</span>
              {[
                { key: 'date' as SortKey, label: '日付' },
                { key: 'daysUntil' as SortKey, label: '日数' },
                { key: 'eventType' as SortKey, label: 'イベント' },
                { key: 'symbol' as SortKey, label: '銘柄' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`cursor-pointer px-3 py-1 text-xs rounded-md transition-colors ${
                    sortBy === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label} {sortBy === key && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
              ))}
            </div>

            {/* イベント一覧 */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">日付</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">イベント</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300">銘柄</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">日数</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sortedEvents.map((event, index) => (
                    <tr key={`${event.symbol}-${event.eventType}-${index}`} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-white font-medium">
                        {formatDate(event.date)}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${event.colorClass}`}>
                          <span className="text-lg">{event.icon}</span>
                          <span className="text-sm font-medium">{event.description}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-white">{event.symbol}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">{event.companyName}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          event.daysUntil <= 0 ? 'bg-red-600 text-white' :
                          event.daysUntil <= 3 ? 'bg-yellow-600 text-white' :
                          event.daysUntil <= 7 ? 'bg-blue-600 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {getDaysUntilDisplay(event.daysUntil)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* サマリー */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">総イベント数</div>
                <div className="text-2xl font-bold text-white">{sortedEvents.length}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">今週以内</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {sortedEvents.filter(e => e.daysUntil >= 0 && e.daysUntil <= 7).length}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">決算発表</div>
                <div className="text-2xl font-bold text-blue-400">
                  {sortedEvents.filter(e => e.eventType === 'earnings').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">権利確定</div>
                <div className="text-2xl font-bold text-green-400">
                  {sortedEvents.filter(e => e.eventType.includes('rights')).length}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}