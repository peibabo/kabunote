'use client';

import { useMemo } from 'react';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { calculateDaysUntil } from '@/hooks/dividend/useDividendBenefitList';

interface EarningsCountdownProps {
  stockCalendarData: CalendarDataMap;
  onStockClick: (symbol: string) => void;
}

interface EarningsItem {
  symbol: string;
  name: string;
  earningsDate: string;
  daysUntil: number;
}

function getUrgencyStyle(days: number) {
  if (days <= 0) return {
    border: 'border-red-500/60', bg: 'bg-red-900/30', text: 'text-red-300',
    glow: '0 0 12px rgba(239, 68, 68, 0.4)', pulse: true, icon: '🔥',
  };
  if (days <= 3) return {
    border: 'border-orange-500/60', bg: 'bg-orange-900/30', text: 'text-orange-300',
    glow: '0 0 10px rgba(249, 115, 22, 0.35)', pulse: true, icon: '⚡',
  };
  if (days <= 7) return {
    border: 'border-yellow-500/50', bg: 'bg-yellow-900/20', text: 'text-yellow-300',
    glow: '0 0 8px rgba(234, 179, 8, 0.25)', pulse: false, icon: '⏰',
  };
  if (days <= 14) return {
    border: 'border-blue-500/40', bg: 'bg-blue-900/20', text: 'text-blue-300',
    glow: '0 0 6px rgba(59, 130, 246, 0.2)', pulse: false, icon: '📅',
  };
  return {
    border: 'border-gray-600/40', bg: 'bg-gray-800/30', text: 'text-gray-400',
    glow: 'none', pulse: false, icon: '📋',
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function useEarningsItems(stockCalendarData: CalendarDataMap): EarningsItem[] {
  return useMemo(() => {
    const items: EarningsItem[] = [];
    for (const [symbol, data] of Object.entries(stockCalendarData)) {
      if (!data.earningsDate) continue;
      const daysUntil = calculateDaysUntil(data.earningsDate);
      if (daysUntil < 0 || daysUntil > 30) continue;
      items.push({ symbol, name: data.name, earningsDate: data.earningsDate, daysUntil });
    }
    return items.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [stockCalendarData]);
}

export default function EarningsCountdown({ stockCalendarData, onStockClick }: EarningsCountdownProps) {
  const earningsItems = useEarningsItems(stockCalendarData);

  if (earningsItems.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-4">30日以内に決算予定の銘柄はありません</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
      {earningsItems.map((item) => {
        const style = getUrgencyStyle(item.daysUntil);
        return (
          <button
            key={item.symbol}
            onClick={() => onStockClick(item.symbol)}
            className={`cursor-pointer text-left p-3 rounded-lg border ${style.border} ${style.bg} transition-all duration-200 hover:scale-[1.02] ${style.pulse ? 'animate-pulse' : ''}`}
            style={{ boxShadow: style.glow }}
          >
            <div className="flex items-center gap-1 mb-1">
              <span className="text-sm">{style.icon}</span>
              <span className={`text-lg font-bold ${style.text}`}>
                {item.daysUntil === 0 ? '当日' : `${item.daysUntil}日後`}
              </span>
            </div>
            <div className="text-xs text-gray-300 truncate font-medium">{item.name}</div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">{item.symbol}</span>
              <span className="text-xs text-gray-500">{formatDate(item.earningsDate)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
