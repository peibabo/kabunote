'use client';

import { useMemo, useState } from 'react';
import { InvestmentEvent, TimelineEvent, CalendarDay } from '@/types/investmentCalendar';
import { formatDateString } from '@/lib/investmentCalendarCalc';
import { getEventStyle, shouldShowDateLabel, getEventDotColor } from '@/utils/timelineUtils';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { useAccordionState } from '@/hooks/useAccordionState';
import { useTooltipState } from '@/hooks/useTooltipState';

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

  // 月間カレンダーのアコーディオン状態
  const { isExpanded: isCalendarExpanded, toggle: toggleCalendarExpanded } = useAccordionState({
    storageKey: STORAGE_KEYS.TIMELINE_CALENDAR_EXPANDED,
  });

  // 月間カレンダーの現在月
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // カレンダーツールチップ用
  const {
    tooltip: calendarTooltipState,
    show: showCalendarTooltip,
    hide: hideCalendarTooltip,
    scheduleHide: scheduleCalendarTooltipHide,
    clearHideTimeout: clearCalendarHideTimeout,
    handleTooltipEnter: handleCalendarTooltipEnter,
    handleTooltipLeave: handleCalendarTooltipLeave,
  } = useTooltipState<InvestmentEvent[]>(100);

  // タイムラインデータの生成（過去60日 + 今日 + 未来59日 = 120日）
  const timelineData = useMemo<TimelineEvent[]>(() => {
    const today = new Date();
    const timeline: TimelineEvent[] = [];

    // 120日分のデータを生成（対称的に表示）
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

    // 日付順でソート
    return timeline.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [events]);

  // ツールチップ管理
  const handleEventHover = (e: React.MouseEvent, timelineEvent: TimelineEvent) => {
    clearTooltipHideTimeout();

    const rect = e.currentTarget.getBoundingClientRect();
    const eventCount = timelineEvent.events.length;

    // イベント数に応じて高さを計算（基本80px + イベント×55px）
    const tooltipHeight = 80 + (eventCount * 55);

    // 画面上部のスペースをチェック
    const spaceAbove = rect.top;
    const showAbove = spaceAbove > tooltipHeight + 20;

    // Y位置を決定
    const yPosition = showAbove
      ? rect.top - tooltipHeight - 10
      : rect.bottom + 10;

    // X位置を画面端に合わせて調整
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

  // カレンダーデータの生成
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    const todayStr = formatDateString(today);

    // 月の最初と最後の日
    const firstDay = new Date(year, month, 1);
    // カレンダーの開始日（月曜日始まり）
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    // 6週間分の日付を生成
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

  // カレンダーツールチップ管理
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

  // 月移動ハンドラー
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


  // 今月のイベント数を計算
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

  // タイムラインが空の場合
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
          {/* 水平タイムライン */}
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
                // 位置計算（今日を中心として相対位置）
                const totalDays = 120; // -60 to +59
                const dayPosition = (timelineEvent.daysFromToday + 60) / totalDays;
                const leftPercent = Math.max(0, Math.min(100, dayPosition * 100));

                // 最も優先度の高いイベントのスタイルを使用
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
                    {/* メインドット */}
                    <div
                      className={`
                        ${eventStyle.size} ${eventStyle.color} ${eventStyle.opacity} ${eventStyle.animation}
                        rounded-full shadow-lg ${eventStyle.glow}
                        border-2 border-gray-800
                        transition-all duration-200 hover:scale-125
                      `}
                    />

                    {/* 複数イベントの場合は重ね表示 */}
                    {timelineEvent.events.length > 1 && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full text-xs flex items-center justify-center">
                        <span className="text-gray-900 font-bold text-[8px]">
                          {timelineEvent.events.length}
                        </span>
                      </div>
                    )}

                    {/* 日付ラベル */}
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

        {/* 月間カレンダー（アコーディオン） */}
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

                  {/* イベントドット */}
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

            {/* 凡例（コンパクト） */}
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

          {/* カレンダーツールチップ（展開時のみ表示） */}
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
              {/* 透明なパディング領域（hover可能エリア拡大） */}
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
      </div>

      {/* 動的ツールチップ */}
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
            {/* 日付ヘッダー */}
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

            {/* イベント一覧 */}
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