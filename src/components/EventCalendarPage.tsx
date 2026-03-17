'use client';

import React from 'react';
import { DividendRightsSettings, ShareholderRightsSettings, ShareholderMeetingSettings } from '@/types/rightsDate';
import { formatMonthDay } from '@/lib/dateFormat';
import {
  useEventCalendarData,
  getDaysUntilDisplay,
  MONTH_NAMES,
  type EventData,
  type EventSortKey,
  type EventFilterType,
} from '@/hooks/useEventCalendarData';

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
  const {
    selectedMonth, selectedYear,
    sortBy, sortOrder, filterType, setFilterType,
    sortedEvents, handleSort, changeMonth,
  } = useEventCalendarData(stockSymbols, stockData);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* 月ナビゲーション */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <button
            onClick={() => changeMonth('prev')}
            className="cursor-pointer p-1 sm:p-2 text-sm sm:text-base text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            ← 前月
          </button>
          <h2 className="text-lg sm:text-xl font-semibold">{selectedYear}年 {MONTH_NAMES[selectedMonth]}</h2>
          <button
            onClick={() => changeMonth('next')}
            className="cursor-pointer p-1 sm:p-2 text-sm sm:text-base text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
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
            {/* フィルター */}
            <div className="flex justify-center gap-1 sm:gap-2 mb-4 sm:mb-6">
              {([
                { key: 'all' as EventFilterType, label: '全て' },
                { key: 'earnings' as EventFilterType, label: '決算' },
                { key: 'dividend' as EventFilterType, label: '配当' },
                { key: 'shareholder' as EventFilterType, label: '優待' },
                { key: 'meeting' as EventFilterType, label: '総会' }
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key)}
                  className={`cursor-pointer px-2 py-1 sm:px-3 text-xs rounded-md transition-colors whitespace-nowrap ${
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
            <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
              <span className="text-xs sm:text-sm text-gray-400 self-center mr-1 sm:mr-2">並び替え:</span>
              {([
                { key: 'date' as EventSortKey, label: '日付' },
                { key: 'daysUntil' as EventSortKey, label: '日数' },
                { key: 'eventType' as EventSortKey, label: 'イベント' },
                { key: 'symbol' as EventSortKey, label: '銘柄' }
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`cursor-pointer px-2 py-1 sm:px-3 text-xs rounded-md transition-colors whitespace-nowrap ${
                    sortBy === key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {label} {sortBy === key && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
              ))}
            </div>

            {/* デスクトップテーブル */}
            <div className="hidden md:block bg-gray-800 rounded-lg overflow-hidden">
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
                    <EventDesktopRow key={`${event.symbol}-${event.eventType}-${index}`} event={event} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* モバイルカード */}
            <div className="md:hidden space-y-2">
              {sortedEvents.map((event, index) => (
                <EventMobileCard key={`mobile-${event.symbol}-${event.eventType}-${index}`} event={event} />
              ))}
            </div>

            {/* サマリー */}
            <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">総イベント数</div>
                <div className="text-xl sm:text-2xl font-bold text-white">{sortedEvents.length}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">今週以内</div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                  {sortedEvents.filter(e => e.daysUntil >= 0 && e.daysUntil <= 7).length}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">決算発表</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-400">
                  {sortedEvents.filter(e => e.eventType === 'earnings').length}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-gray-400 mb-1">権利確定</div>
                <div className="text-xl sm:text-2xl font-bold text-green-400">
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

function DaysUntilBadge({ daysUntil }: { daysUntil: number }) {
  const bgClass = daysUntil <= 0 ? 'bg-red-600 text-white'
    : daysUntil <= 3 ? 'bg-yellow-600 text-white'
    : daysUntil <= 7 ? 'bg-blue-600 text-white'
    : 'bg-gray-600 text-gray-300';

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bgClass}`}>
      {getDaysUntilDisplay(daysUntil)}
    </span>
  );
}

function EventDesktopRow({ event }: { event: EventData }) {
  return (
    <tr className="hover:bg-gray-750">
      <td className="px-4 py-3 text-white font-medium">{formatMonthDay(event.date)}</td>
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
        <DaysUntilBadge daysUntil={event.daysUntil} />
      </td>
    </tr>
  );
}

function EventMobileCard({ event }: { event: EventData }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs ${event.colorClass}`}>
          <span>{event.icon}</span>
          <span className="font-medium">{event.description}</span>
        </div>
        <DaysUntilBadge daysUntil={event.daysUntil} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{event.symbol}</span>
          <span className="text-xs text-gray-400 truncate max-w-[150px]">{event.companyName}</span>
        </div>
        <span className="text-sm text-gray-300">{formatMonthDay(event.date)}</span>
      </div>
    </div>
  );
}
