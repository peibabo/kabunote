'use client';

import { useState, useEffect, useMemo } from 'react';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { EventSummary, InvestmentEvent } from '@/types/investmentCalendar';
import { formatDateString, calculateFullDateFromMonthDay, calculateBusinessDaysBefore } from '@/lib/investmentCalendarCalc';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { playSound } from '@/lib/sound';
import { useMonthlyDividendData } from '@/hooks/dividend/useMonthlyDividendData';
import { useDividendRanking } from './DividendYieldRanking';
import InvestmentTimeline from './InvestmentTimeline';
import MonthlyCalendar from './MonthlyCalendar';
import MonthlyDividendChart from './MonthlyDividendChart';
import DividendYieldRanking from './DividendYieldRanking';

type TabId = 'events' | 'timeline' | 'calendar' | 'dividend';

interface TabDef {
  id: TabId;
  label: string;
  icon: string;
  count?: number;
  hasData: boolean;
}

interface InvestmentScheduleWidgetProps {
  stockCalendarData: CalendarDataMap;
  dividendBenefitData: Record<string, DividendBenefitStockData>;
  onStockClick: (symbol: string) => void;
}

// イベントタイプ別のアイコン
function getEventIcon(type: InvestmentEvent['type']): string {
  switch (type) {
    case 'earnings': return '📈';
    case 'shareholder-meeting': return '🏛️';
    case 'dividend-rights-last':
    case 'dividend-rights-confirmation': return '💰';
    case 'shareholder-rights-last':
    case 'shareholder-rights-confirmation': return '🎁';
    default: return '📅';
  }
}

// イベントタイプ別のラベル
function getEventLabel(type: InvestmentEvent['type']): string {
  switch (type) {
    case 'earnings': return '決算発表';
    case 'shareholder-meeting': return '株主総会';
    case 'dividend-rights-last': return '配当権利付き最終日';
    case 'dividend-rights-confirmation': return '配当権利確定日';
    case 'shareholder-rights-last': return '優待権利付き最終日';
    case 'shareholder-rights-confirmation': return '優待権利確定日';
    default: return 'イベント';
  }
}

// 緊急度スタイル
function getUrgencyStyle(days: number) {
  if (days <= 0) return { border: 'border-red-500/60', bg: 'bg-red-900/30', text: 'text-red-300', glow: '0 0 12px rgba(239, 68, 68, 0.4)', pulse: true };
  if (days <= 3) return { border: 'border-orange-500/60', bg: 'bg-orange-900/30', text: 'text-orange-300', glow: '0 0 10px rgba(249, 115, 22, 0.35)', pulse: true };
  if (days <= 7) return { border: 'border-yellow-500/50', bg: 'bg-yellow-900/20', text: 'text-yellow-300', glow: '0 0 8px rgba(234, 179, 8, 0.25)', pulse: false };
  if (days <= 14) return { border: 'border-blue-500/40', bg: 'bg-blue-900/20', text: 'text-blue-300', glow: '0 0 6px rgba(59, 130, 246, 0.2)', pulse: false };
  return { border: 'border-gray-600/40', bg: 'bg-gray-800/30', text: 'text-gray-400', glow: 'none', pulse: false };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 日数差を計算
function calculateDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// eventMap生成（InvestmentCalendar.tsxから移植）
function useEventMap(stockCalendarData: CalendarDataMap): EventSummary {
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

// 直近イベントリスト（未来60日以内のイベントを日付順にフラット化）
interface UpcomingEvent {
  event: InvestmentEvent;
  daysUntil: number;
}

function useUpcomingEvents(eventMap: EventSummary): UpcomingEvent[] {
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

// 直近イベントタブのコンテンツ
function UpcomingEventsContent({ events, onStockClick }: { events: UpcomingEvent[]; onStockClick: (symbol: string) => void }) {
  if (events.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-4">7日以内に予定されているイベントはありません</div>;
  }

  return (
    <div className="space-y-1.5">
      {events.map(({ event, daysUntil }) => {
        const style = getUrgencyStyle(daysUntil);
        const icon = getEventIcon(event.type);

        return (
          <button
            key={event.id}
            onClick={() => onStockClick(event.symbol)}
            className={`cursor-pointer w-full text-left p-2.5 rounded-lg border ${style.border} ${style.bg} transition-all duration-200 hover:scale-[1.01] ${style.pulse ? 'animate-pulse' : ''}`}
            style={{ boxShadow: style.glow }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">{icon}</span>
                <span className={`text-sm font-bold ${style.text} shrink-0`}>
                  {daysUntil === 0 ? '本日' : daysUntil === 1 ? '明日' : `${daysUntil}日後`}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{getEventLabel(event.type)}</span>
                <span className="text-xs text-gray-300 truncate font-medium">{event.companyName}({event.symbol})</span>
              </div>
              <span className="text-xs text-gray-500 shrink-0 ml-2">{formatDate(event.date)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// 配当タブのコンテンツ（棒グラフ + ランキング縦積み）
function DividendTabContent({ dividendBenefitData, onStockClick }: {
  dividendBenefitData: Record<string, DividendBenefitStockData>;
  onStockClick: (symbol: string) => void;
}) {
  return (
    <div className="space-y-4">
      <MonthlyDividendChart dividendBenefitData={dividendBenefitData} />
      <div className="border-t border-gray-700/50 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-1">🏆 配当利回りランキング</h4>
        <DividendYieldRanking dividendBenefitData={dividendBenefitData} onStockClick={onStockClick} />
      </div>
    </div>
  );
}

export default function InvestmentScheduleWidget({
  stockCalendarData,
  dividendBenefitData,
  onStockClick,
}: InvestmentScheduleWidgetProps) {
  const eventMap = useEventMap(stockCalendarData);
  const upcomingEvents = useUpcomingEvents(eventMap);
  const dividendSummary = useMonthlyDividendData(dividendBenefitData);
  const { dividendStockCount } = useDividendRanking(dividendBenefitData);

  const hasEventData = Object.keys(eventMap).length > 0;
  const hasDividendData = dividendSummary.stockCount > 0 || dividendStockCount > 0;

  const tabs: TabDef[] = [
    { id: 'events', label: '直近', icon: '🔔', count: upcomingEvents.length, hasData: upcomingEvents.length > 0 },
    { id: 'timeline', label: 'タイムライン', icon: '⏱️', hasData: hasEventData },
    { id: 'calendar', label: 'カレンダー', icon: '📅', hasData: hasEventData },
    { id: 'dividend', label: '配当', icon: '💰', hasData: hasDividendData },
  ];

  const availableTabs = tabs.filter(t => t.hasData);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE_WIDGET_TAB);
      if (saved && availableTabs.some(t => t.id === saved)) return saved as TabId;
    }
    return availableTabs[0]?.id ?? 'events';
  });

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  if (availableTabs.length === 0) return null;

  const handleTabChange = (tabId: TabId) => {
    playSound('toggle');
    setActiveTab(tabId);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_WIDGET_TAB, tabId);
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-4 animate-fade-in">
      {/* ヘッダー + タブ */}
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-base font-semibold text-white shrink-0">📈 投資スケジュール</h3>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`cursor-pointer text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-1 ${activeTab === tab.id ? 'text-blue-200' : 'text-gray-500'}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'events' && (
        <UpcomingEventsContent events={upcomingEvents} onStockClick={onStockClick} />
      )}
      {activeTab === 'timeline' && (
        <InvestmentTimeline events={eventMap} onStockClick={onStockClick} includeCalendar={false} />
      )}
      {activeTab === 'calendar' && (
        <MonthlyCalendar events={eventMap} onStockClick={onStockClick} standalone />
      )}
      {activeTab === 'dividend' && (
        <DividendTabContent dividendBenefitData={dividendBenefitData} onStockClick={onStockClick} />
      )}
    </div>
  );
}
