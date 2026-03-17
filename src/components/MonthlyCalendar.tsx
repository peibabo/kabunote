'use client';

import React, { useState, useMemo } from 'react';
import { InvestmentEvent, CalendarDay } from '@/types/investmentCalendar';
import { formatDateString } from '@/lib/investmentCalendarCalc';
import { getEventDotColor } from '@/utils/timelineUtils';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { useAccordionState } from '@/hooks/useAccordionState';
import { useTooltipState } from '@/hooks/useTooltipState';

interface MonthlyCalendarProps {
  events: Record<string, InvestmentEvent[]>;
  onStockClick?: (symbol: string) => void;
}

export default function MonthlyCalendar({ events, onStockClick }: MonthlyCalendarProps) {
  const { isExpanded: isCalendarExpanded, toggle: toggleCalendarExpanded } = useAccordionState({
    storageKey: STORAGE_KEYS.TIMELINE_CALENDAR_EXPANDED,
  });

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    tooltip: calendarTooltipState,
    show: showCalendarTooltip,
    hide: hideCalendarTooltip,
    scheduleHide: scheduleCalendarTooltipHide,
    clearHideTimeout: clearCalendarHideTimeout,
    handleTooltipEnter: handleCalendarTooltipEnter,
    handleTooltipLeave: handleCalendarTooltipLeave,
  } = useTooltipState<InvestmentEvent[]>(100);

  // カレンダーデータの生成
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    const todayStr = formatDateString(today);

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      const dateStr = formatDateString(currentDate);
      const isCurrentMonth = currentDate.getMonth() === month;
      const isToday = dateStr === todayStr;
      const eventsForDate = events[dateStr] || [];

      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        events: eventsForDate
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, events]);

  // 今月のイベント数
  const currentMonthEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    let eventCount = 0;
    Object.keys(events).forEach(dateKey => {
      const eventDate = new Date(dateKey);
      if (eventDate >= monthStart && eventDate <= monthEnd) {
        eventCount += events[dateKey].length;
      }
    });

    return eventCount;
  }, [events, currentMonth]);

  const handleCalendarDayHover = (event: React.MouseEvent, day: CalendarDay) => {
    clearCalendarHideTimeout();

    if (day.events.length > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      showCalendarTooltip(
        { x: rect.left + rect.width / 2, y: rect.top - 20 },
        day.events
      );
    } else {
      hideCalendarTooltip();
    }
  };

  const handleCalendarDayLeave = () => {
    scheduleCalendarTooltipHide();
  };

  const handlePreviousMonth = () => {
    clearCalendarHideTimeout();
    hideCalendarTooltip();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    clearCalendarHideTimeout();
    hideCalendarTooltip();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="mt-4 border-t border-gray-700 pt-4">
      <button
        onClick={toggleCalendarExpanded}
        className="w-full flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span><h3 className="text-sm font-medium text-gray-200">月間カレンダー</h3>
          {currentMonthEvents > 0 && (
            <span className="text-xs text-gray-400">
              ({currentMonthEvents}件)
            </span>
          )}
        </div>
        <div className={`transform transition-transform duration-200 text-gray-400 ${
          isCalendarExpanded ? 'rotate-180' : 'rotate-0'
        }`}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 6l4 4 4-4H4z"/>
          </svg>
        </div>
      </button>

      {/* アコーディオンコンテンツ */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isCalendarExpanded
          ? 'max-h-[800px] opacity-100 mt-4'
          : 'max-h-0 opacity-0'
      }`}>
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-center space-x-4 mb-4 mt-2">
          <button
            onClick={handlePreviousMonth}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            ←
          </button>
          <span className="text-white text-sm font-thin min-w-[120px] text-center">
            {currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={handleNextMonth}
            className="cursor-pointer text-gray-400 hover:text-white transition-colors"
          >
            →
          </button>
        </div>

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['月', '火', '水', '木', '金', '土', '日'].map(day => (
            <div key={day} className="text-center text-xs text-gray-400 font-thin p-1">
              {day}
            </div>
          ))}
        </div>

        {/* カレンダーグリッド */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                relative h-10 p-1 text-center transition-colors rounded-sm
                ${day.isCurrentMonth ? 'text-gray-200' : 'text-gray-600'}
                ${day.isToday ? 'bg-blue-900 bg-opacity-30' : 'hover:bg-slate-800'}
                ${day.events.length > 0 ? 'cursor-pointer' : ''}
              `}
              onMouseEnter={(e) => handleCalendarDayHover(e, day)}
              onMouseLeave={handleCalendarDayLeave}
              onClick={(e) => {
                if (day.events.length === 0) {
                  e.stopPropagation();
                  hideCalendarTooltip();
                }
              }}
            >
              <div className="text-xs font-thin">{day.day}</div>

              {day.events.length > 0 && (
                <div className="flex justify-center space-x-0.5 mt-1">
                  {day.events.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`w-1 h-1 rounded-full ${getEventDotColor(event.type)}`}
                    />
                  ))}
                  {day.events.length > 3 && (
                    <div className="w-1 h-1 rounded-full bg-gray-500" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <span>決算</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>配当</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            <span>優待</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span>総会</span>
          </div>
        </div>
      </div>

      {/* カレンダーツールチップ */}
      {isCalendarExpanded && calendarTooltipState.show && calendarTooltipState.data && (
        <div
          data-tooltip="true"
          className="fixed z-50"
          style={{
            left: calendarTooltipState.x - 100,
            top: calendarTooltipState.y - 25,
          }}
          onMouseEnter={handleCalendarTooltipEnter}
          onMouseLeave={handleCalendarTooltipLeave}
        >
          <div className="p-2">
            <div
              className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-2">
                {calendarTooltipState.data!.map((event, index) => (
                  <div
                    key={index}
                    className="text-xs cursor-pointer hover:text-blue-300 transition-colors"
                    onClick={() => onStockClick?.(event.symbol)}
                  >
                    <div className="font-medium text-white">
                      [{event.symbol}] {event.companyName}
                    </div>
                    <div className="text-gray-300">
                      {event.title}
                      {event.isRecurring && <span className="text-green-400 ml-1">↻</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
