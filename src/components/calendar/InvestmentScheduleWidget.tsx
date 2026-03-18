'use client';

import { useState, useEffect } from 'react';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { DividendBenefitStockData } from '@/hooks/dividend/useDividendBenefitData';
import { STORAGE_KEYS } from '@/lib/storageKeys';
import { playSound } from '@/lib/sound';
import EarningsCountdown, { useEarningsItems } from './EarningsCountdown';
import RightsDateCountdown, { useRightsItems } from './RightsDateCountdown';
import MonthlyDividendChart, { useMonthlyDividendData } from './MonthlyDividendChart';
import DividendYieldRanking, { useDividendRanking } from './DividendYieldRanking';

type TabId = 'earnings' | 'rights' | 'dividend' | 'yield';

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

export default function InvestmentScheduleWidget({
  stockCalendarData,
  dividendBenefitData,
  onStockClick,
}: InvestmentScheduleWidgetProps) {
  const earningsItems = useEarningsItems(stockCalendarData);
  const rightsItems = useRightsItems(stockCalendarData);
  const dividendSummary = useMonthlyDividendData(dividendBenefitData);
  const { dividendStockCount } = useDividendRanking(dividendBenefitData);

  const tabs: TabDef[] = [
    { id: 'earnings', label: '決算', icon: '📊', count: earningsItems.length, hasData: earningsItems.length > 0 },
    { id: 'rights', label: '権利', icon: '🎯', count: rightsItems.length, hasData: rightsItems.length > 0 },
    { id: 'dividend', label: '配当', icon: '💰', hasData: dividendSummary.stockCount > 0 },
    { id: 'yield', label: '利回り', icon: '🏆', hasData: dividendStockCount > 0 },
  ];

  const availableTabs = tabs.filter(t => t.hasData);

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULE_WIDGET_TAB);
      if (saved && availableTabs.some(t => t.id === saved)) return saved as TabId;
    }
    return availableTabs[0]?.id ?? 'earnings';
  });

  // アクティブタブがデータなしになった場合、最初の利用可能タブに切り替え
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
      {activeTab === 'earnings' && (
        <EarningsCountdown stockCalendarData={stockCalendarData} onStockClick={onStockClick} />
      )}
      {activeTab === 'rights' && (
        <RightsDateCountdown stockCalendarData={stockCalendarData} onStockClick={onStockClick} />
      )}
      {activeTab === 'dividend' && (
        <MonthlyDividendChart dividendBenefitData={dividendBenefitData} />
      )}
      {activeTab === 'yield' && (
        <DividendYieldRanking dividendBenefitData={dividendBenefitData} onStockClick={onStockClick} />
      )}
    </div>
  );
}
