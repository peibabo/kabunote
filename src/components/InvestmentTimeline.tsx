'use client';

import React, { useMemo } from 'react';
import { InvestmentEvent, TimelineEvent } from '@/types/investmentCalendar';
import { formatDateString } from '@/lib/investmentCalendarCalc';
import { getEventStyle, shouldShowDateLabel } from '@/utils/timelineUtils';
import { useTooltipState } from '@/hooks/useTooltipState';
import MonthlyCalendar from '@/components/MonthlyCalendar';

interface InvestmentTimelineProps {
  events: Record<string, InvestmentEvent[]>;
  onStockClick?: (symbol: string) => void;
}

export default function InvestmentTimeline({ events, onStockClick }: InvestmentTimelineProps) {
  const {
    tooltip: timelineTooltip,
    show: showTooltip,
    scheduleHide: scheduleTooltipHide,
    clearHideTimeout: clearTooltipHideTimeout,
    handleTooltipEnter,
    handleTooltipLeave,
  } = useTooltipState<TimelineEvent>(150);

  // タイムラインデータの生成（過去60日 + 今日 + 未来59日 = 120日）
  const timelineData = useMemo<TimelineEvent[]>(() => {
    const today = new Date();
    const timeline: TimelineEvent[] = [];

    for (let i = -60; i <= 59; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = formatDateString(date);
      const dateEvents = events[dateStr] || [];

      if (dateEvents.length > 0) {
        timeline.push({
          date: dateStr,
          dateObj: date,
          events: dateEvents,
          daysFromToday: i,
          isToday: i === 0,
          isPast: i < 0
        });
      }
    }

    return timeline.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [events]);

  // ツールチップ管理
  const handleEventHover = (e: React.MouseEvent, timelineEvent: TimelineEvent) => {
    clearTooltipHideTimeout();

    const rect = e.currentTarget.getBoundingClientRect();
    const eventCount = timelineEvent.events.length;
    const tooltipHeight = 80 + (eventCount * 55);
    const spaceAbove = rect.top;
    const showAbove = spaceAbove > tooltipHeight + 20;

    const yPosition = showAbove
      ? rect.top - tooltipHeight - 10
      : rect.bottom + 10;

    const tooltipWidth = Math.min(280, window.innerWidth - 32);
    const xPosition = Math.max(10, Math.min(
      window.innerWidth - tooltipWidth - 10,
      rect.left + rect.width / 2 - tooltipWidth / 2
    ));

    showTooltip({ x: xPosition, y: yPosition }, timelineEvent);
  };

  const handleEventLeave = () => {
    scheduleTooltipHide();
  };

  if (timelineData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <span className="text-gray-400">📅 予定されているイベントはありません</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <span className="text-lg">⏱️</span>
        <h3 className="text-lg font-semibold text-white">投資タイムライン</h3>
        <span className="text-xs text-gray-400">
          ({timelineData.length}件のイベント)
        </span>
      </div>

      {/* タイムライン本体 */}
      <div className="relative">
        <div className="overflow-x-auto pb-1">
          <div className="relative min-w-[800px] h-16">
            {/* ベースライン */}
            <div className="absolute top-8 left-0 right-0 h-px bg-gray-600"></div>

            {/* 今日のマーカー */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-px h-4 bg-blue-400 animate-pulse"></div>
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 whitespace-nowrap mt-1 font-medium">
                今日
              </div>
            </div>

            {/* イベントドット */}
            {timelineData.map((timelineEvent, index) => {
              const totalDays = 120;
              const dayPosition = (timelineEvent.daysFromToday + 60) / totalDays;
              const leftPercent = Math.max(0, Math.min(100, dayPosition * 100));

              const highestPriorityEvent = timelineEvent.events.reduce((prev, current) => {
                const prevStyle = getEventStyle(prev.type, timelineEvent.isPast, timelineEvent.daysFromToday);
                const currentStyle = getEventStyle(current.type, timelineEvent.isPast, timelineEvent.daysFromToday);
                return currentStyle.priority >= prevStyle.priority ? current : prev;
              });

              const eventStyle = getEventStyle(
                highestPriorityEvent.type,
                timelineEvent.isPast,
                timelineEvent.daysFromToday
              );

              return (
                <div
                  key={timelineEvent.date}
                  className="absolute top-6 transform -translate-x-1/2 cursor-pointer"
                  style={{ left: `${leftPercent}%` }}
                  onMouseEnter={(e) => handleEventHover(e, timelineEvent)}
                  onMouseLeave={handleEventLeave}
                >
                  <div
                    className={`
                      ${eventStyle.size} ${eventStyle.color} ${eventStyle.opacity} ${eventStyle.animation}
                      rounded-full shadow-lg ${eventStyle.glow}
                      border-2 border-gray-800
                      transition-all duration-200 hover:scale-125
                    `}
                  />

                  {timelineEvent.events.length > 1 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full text-xs flex items-center justify-center">
                      <span className="text-gray-900 font-bold text-[8px]">
                        {timelineEvent.events.length}
                      </span>
                    </div>
                  )}

                  {shouldShowDateLabel(timelineEvent.dateObj, index) && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap mt-1">
                      {timelineEvent.isToday ? '今日' : `${timelineEvent.dateObj.getMonth() + 1}/${timelineEvent.dateObj.getDate()}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 凡例 */}
        <div className="flex flex-wrap justify-center gap-3 mt-2 text-xs text-gray-400 border-t border-gray-700 pt-2">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span>決算発表</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>配当</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>優待</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>株主総会</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 rounded-full bg-gray-500 opacity-40"></div>
            <span>過去のイベント</span>
          </div>
        </div>

        {/* 月間カレンダー */}
        <MonthlyCalendar events={events} onStockClick={onStockClick} />
      </div>

      {/* タイムラインツールチップ */}
      {timelineTooltip.show && timelineTooltip.data && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: timelineTooltip.x,
            top: timelineTooltip.y,
          }}
        >
          <div
            className="pointer-events-auto bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl"
            style={{ width: '280px', maxWidth: 'calc(100vw - 2rem)' }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          >
            <div className="text-sm font-medium text-white mb-2 border-b border-gray-700 pb-2">
              {timelineTooltip.data!.dateObj.toLocaleDateString('ja-JP', {
                month: 'long',
                day: 'numeric'
              })}
              {timelineTooltip.data!.isToday && (
                <span className="text-blue-400 ml-2 text-xs">今日</span>
              )}
              {!timelineTooltip.data!.isPast && !timelineTooltip.data!.isToday && (
                <span className="text-green-400 ml-2 text-xs">
                  あと{timelineTooltip.data!.daysFromToday}日
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timelineTooltip.data!.events.map((event, index) => (
                <div
                  key={index}
                  className="text-xs cursor-pointer hover:text-blue-300 transition-colors p-2 rounded-md hover:bg-gray-800"
                  onClick={() => onStockClick?.(event.symbol)}
                >
                  <div className="font-medium text-white mb-1">
                    [{event.symbol}] {event.companyName}
                  </div>
                  <div className="text-gray-300">
                    {event.title}
                    {event.isRecurring && (
                      <span className="text-green-400 ml-1">↻</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
