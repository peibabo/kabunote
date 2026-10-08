'use client';

import { useState, useEffect } from 'react';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { playSound } from '@/lib/sound';
import { useMonthlyDividendData } from '@/hooks/dividend/useMonthlyDividendData';
import { useDividendRanking } from './DividendYieldRanking';
import InvestmentTimeline from './InvestmentTimeline';
import MonthlyCalendar from './MonthlyCalendar';
import MonthlyDividendChart from './MonthlyDividendChart';
import DividendYieldRanking from './DividendYieldRanking';
import { useEventMap, useUpcomingEvents } from './schedule-widget/useEventMap';
import UpcomingEventsContent from './schedule-widget/UpcomingEventsContent';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';

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
      const saved = safeGetItem(STORAGE_KEYS.SCHEDULE_WIDGET_TAB);
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
    safeSetItem(STORAGE_KEYS.SCHEDULE_WIDGET_TAB, tabId);
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
