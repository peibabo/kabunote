'use client';

import { useState, useEffect } from 'react';
import { stockKey } from '@/lib/storageKeys';
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents';
import { playSound } from '@/lib/sound';

type TabOption = {
  label: string;
  icon: string;
  mainTab: string;
  investmentSubTab?: string;
  managementSubTab?: string;
};

const TAB_OPTIONS: TabOption[] = [
  { label: '基本', icon: '📝', mainTab: 'basic' },
  { label: 'シナリオ', icon: '📊', mainTab: 'analysis', investmentSubTab: 'analysis' },
  { label: '次の一手', icon: '🎯', mainTab: 'analysis', investmentSubTab: 'nextaction' },
  { label: '保有状況', icon: '💼', mainTab: 'management', managementSubTab: 'positions' },
  { label: 'イベント', icon: '📅', mainTab: 'management', managementSubTab: 'events' },
  { label: '配当', icon: '💰', mainTab: 'management', managementSubTab: 'dividend' },
  { label: '優待', icon: '🎁', mainTab: 'management', managementSubTab: 'shareholder' },
];

type Props = {
  stockSymbols: string[];
};

export default function BulkTabSwitcher({ stockSymbols }: Props) {
  const [activeOption, setActiveOption] = useState<TabOption | null>(null);

  // 全銘柄が同一タブ設定かチェックしてアクティブ状態を更新
  useEffect(() => {
    if (stockSymbols.length === 0) return;

    const detectActive = () => {
      const firstSymbol = stockSymbols[0];
      const firstMainTab = localStorage.getItem(stockKey.activeTab(firstSymbol)) || 'basic';
      const firstInvTab = localStorage.getItem(stockKey.investmentTab(firstSymbol)) || 'analysis';
      const firstMgmtTab = localStorage.getItem(stockKey.managementTab(firstSymbol)) || 'positions';

      const allSame = stockSymbols.every(symbol => {
        const mt = localStorage.getItem(stockKey.activeTab(symbol)) || 'basic';
        const it = localStorage.getItem(stockKey.investmentTab(symbol)) || 'analysis';
        const mgt = localStorage.getItem(stockKey.managementTab(symbol)) || 'positions';
        return mt === firstMainTab && it === firstInvTab && mgt === firstMgmtTab;
      });

      if (!allSame) {
        setActiveOption(null);
        return;
      }

      const matched = TAB_OPTIONS.find(opt => {
        if (opt.mainTab !== firstMainTab) return false;
        if (opt.investmentSubTab && opt.investmentSubTab !== firstInvTab) return false;
        if (opt.managementSubTab && opt.managementSubTab !== firstMgmtTab) return false;
        if (!opt.investmentSubTab && firstMainTab === 'analysis') return false;
        if (!opt.managementSubTab && firstMainTab === 'management') return false;
        return true;
      });

      setActiveOption(matched ?? null);
    };

    detectActive();

    const handleStorageChange = () => detectActive();
    window.addEventListener(APP_EVENTS.LOCAL_STORAGE_CHANGE, handleStorageChange);
    return () => window.removeEventListener(APP_EVENTS.LOCAL_STORAGE_CHANGE, handleStorageChange);
  }, [stockSymbols]);

  if (stockSymbols.length === 0) return null;

  const handleClick = (option: TabOption) => {
    stockSymbols.forEach(symbol => {
      localStorage.setItem(stockKey.activeTab(symbol), option.mainTab);
      emitAppEvent(APP_EVENTS.LOCAL_STORAGE_CHANGE, { key: stockKey.activeTab(symbol) });

      if (option.investmentSubTab) {
        localStorage.setItem(stockKey.investmentTab(symbol), option.investmentSubTab);
        emitAppEvent(APP_EVENTS.LOCAL_STORAGE_CHANGE, { key: stockKey.investmentTab(symbol) });
      }

      if (option.managementSubTab) {
        localStorage.setItem(stockKey.managementTab(symbol), option.managementSubTab);
        emitAppEvent(APP_EVENTS.LOCAL_STORAGE_CHANGE, { key: stockKey.managementTab(symbol) });
      }
    });

    setActiveOption(option);
  };

  return (
    <div className="bg-slate-800 border-b border-gray-700 px-4 py-2 rounded-lg mb-2">
      <div className="relative">
        <div className="container mx-auto flex items-center gap-1 overflow-x-auto scrollbar-hide">
          <span className="text-gray-400 text-xs mr-2 whitespace-nowrap shrink-0">全カード切替:</span>
          {TAB_OPTIONS.map(option => {
            const isActive = activeOption?.label === option.label;
            return (
              <button
                key={option.label}
                onClick={() => { playSound('toggle'); handleClick(option); }}
                title={option.label}
                className={`cursor-pointer text-xs px-3 py-2 md:py-1 rounded transition-all duration-150 whitespace-nowrap md:flex-1 md:text-center ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {option.icon}<span className="hidden md:inline"> {option.label}</span>
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-800 to-transparent pointer-events-none md:hidden" />
      </div>
    </div>
  );
}
