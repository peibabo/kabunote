'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import {
  InvestmentEvent,
  CalendarDay,
  EventSummary,
  calculateRightsLastDate,
  formatDateString,
  calculateFullDateFromMonthDay
} from '@/types/investmentCalendar';
import { RightsDateSettings } from '@/types/rightsDate';

interface InvestmentCalendarProps {
  stockSymbols: string[];
  stockData: { [symbol: string]: { name: string; earningsDate: string; rightsSettings: RightsDateSettings } };
  onStockClick: (symbol: string) => void;
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  events: InvestmentEvent[];
}

export default function InvestmentCalendar({ stockSymbols, stockData, onStockClick }: InvestmentCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tooltip, setTooltip] = useState<TooltipState>({ show: false, x: 0, y: 0, events: [] });
  const [isExpanded, setIsExpanded] = useState(() => {
    // localStorage から展開状態を復元
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('kabunote-calendar-expanded');
      return saved === 'true';
    }
    return false;
  });
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ツールチップ管理関数
  const clearHideTimeout = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const hideTooltip = () => {
    setTooltip({ show: false, x: 0, y: 0, events: [] });
  };

  // 折りたたみ状態の切り替え
  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('kabunote-calendar-expanded', newState.toString());
    }
    // 折りたたみ時はツールチップも隠す
    if (!newState) {
      clearHideTimeout();
      hideTooltip();
    }
  };

  // コンポーネントのクリーンアップとグローバルイベント
  useEffect(() => {
    const handleClickOutside = () => {
      clearHideTimeout();
      hideTooltip();
    };

    const handleScroll = () => {
      clearHideTimeout();
      hideTooltip();
    };

    document.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

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

      // 権利確定日と権利付き最終日
      if (data.rightsSettings.isActive && data.rightsSettings.month && data.rightsSettings.day) {
        const rightsDate = calculateFullDateFromMonthDay(
          data.rightsSettings.month,
          data.rightsSettings.day,
          data.rightsSettings.isRecurring
        );
        const rightsDateKey = formatDateString(rightsDate);

        // 権利確定日
        if (!events[rightsDateKey]) events[rightsDateKey] = [];
        events[rightsDateKey].push({
          id: `${symbol}-rights-confirmation`,
          symbol,
          companyName: data.name,
          date: rightsDateKey,
          type: 'rights-confirmation',
          title: '権利確定',
          isRecurring: data.rightsSettings.isRecurring
        });

        // 権利付き最終日
        const lastDate = calculateRightsLastDate(rightsDate);
        const lastDateKey = formatDateString(lastDate);
        if (!events[lastDateKey]) events[lastDateKey] = [];
        events[lastDateKey].push({
          id: `${symbol}-rights-last`,
          symbol,
          companyName: data.name,
          date: lastDateKey,
          type: 'rights-last',
          title: '権利付き最終日',
          isRecurring: data.rightsSettings.isRecurring
        });
      }
    });

    return events;
  }, [stockSymbols, stockData]);

  // カレンダー日付の生成
  const calendarDays = useMemo<CalendarDay[]>(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    const todayStr = formatDateString(today);

    // 月の最初と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

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
      const events = eventMap[dateStr] || [];

      days.push({
        date: dateStr,
        day: currentDate.getDate(),
        isCurrentMonth,
        isToday,
        events
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, eventMap]);

  // 月移動ハンドラー
  const handlePreviousMonth = () => {
    clearHideTimeout();
    hideTooltip();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    clearHideTimeout();
    hideTooltip();
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // ツールチップハンドラー

  const handleDayHover = (event: React.MouseEvent, day: CalendarDay) => {
    clearHideTimeout();

    if (day.events.length > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 20,
        events: day.events
      });
    } else {
      hideTooltip();
    }
  };

  const handleDayLeave = () => {
    // ツールチップへの移動時間を確保するため100ms遅延
    hideTimeoutRef.current = setTimeout(() => {
      hideTooltip();
    }, 100);
  };

  const handleTooltipEnter = () => {
    clearHideTimeout();
  };

  const handleTooltipLeave = () => {
    clearHideTimeout();
    hideTooltip();
  };

  // イベントドットの色
  const getEventDotColor = (type: InvestmentEvent['type']) => {
    switch (type) {
      case 'earnings': return 'bg-white';
      case 'rights-last': return 'bg-yellow-400';
      case 'rights-confirmation': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  const currentMonthName = currentMonth.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });

  // 今月のイベント数を計算
  const currentMonthEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    let eventCount = 0;
    Object.keys(eventMap).forEach(dateKey => {
      const eventDate = new Date(dateKey);
      if (eventDate >= monthStart && eventDate <= monthEnd) {
        eventCount += eventMap[dateKey].length;
      }
    });

    return eventCount;
  }, [eventMap, currentMonth]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6 font-thin">
      {/* ヘッダー（常に表示） */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={toggleExpanded}
          className="flex items-center space-x-2 text-lg text-white font-thin hover:text-blue-300 transition-colors"
        >
          <span>📅 投資カレンダー</span>
          {currentMonthEvents > 0 && (
            <span className="text-sm text-blue-300 bg-blue-900 bg-opacity-30 px-2 py-0.5 rounded">
              {currentMonthEvents}件
            </span>
          )}
          <span className="text-sm text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>

        {isExpanded && (
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ←
            </button>
            <span className="text-white text-sm font-thin min-w-[120px] text-center">
              {currentMonthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="text-gray-400 hover:text-white transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* カレンダー本体（展開時のみ表示） */}
      {isExpanded && (
        <>
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['月', '火', '水', '木', '金', '土', '日'].map(day => (
              <div key={day} className="text-center text-xs text-gray-400 font-thin p-2">
                {day}
              </div>
            ))}
          </div>

          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  relative h-12 p-1 text-center transition-colors
                  ${day.isCurrentMonth ? 'text-gray-200' : 'text-gray-600'}
                  ${day.isToday ? 'bg-blue-900 bg-opacity-30' : 'hover:bg-slate-800'}
                  ${day.events.length > 0 ? 'cursor-pointer' : ''}
                `}
                onMouseEnter={(e) => handleDayHover(e, day)}
                onMouseLeave={handleDayLeave}
                onClick={(e) => {
                  if (day.events.length === 0) {
                    e.stopPropagation();
                    hideTooltip();
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
                        className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(event.type)}`}
                      />
                    ))}
                    {day.events.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 凡例 */}
          <div className="flex justify-center space-x-6 mt-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span>決算発表</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <span>権利付き最終日</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>権利確定日</span>
            </div>
          </div>
        </>
      )}

      {/* ツールチップ（展開時のみ表示） */}
      {isExpanded && tooltip.show && (
        <div
          data-tooltip="true"
          className="fixed z-50"
          style={{
            left: tooltip.x - 100,
            top: tooltip.y - 25,
          }}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
        >
          {/* 透明なパディング領域（hover可能エリア拡大） */}
          <div className="p-2">
            <div
              className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
          <div className="space-y-2">
            {tooltip.events.map((event, index) => (
              <div
                key={index}
                className="text-xs cursor-pointer hover:text-blue-300 transition-colors"
                onClick={() => onStockClick(event.symbol)}
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