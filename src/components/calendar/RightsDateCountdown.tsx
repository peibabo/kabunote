'use client';

import { useMemo } from 'react';
import { CalendarDataMap } from '@/hooks/calendar/useCalendarData';
import { calculateDaysUntil } from '@/hooks/dividend/useDividendBenefitList';
import { calculateRightsDateFromSettings, RightsDateSettings } from '@/types/rightsDate';
import { calculateRightsLastDate, formatDateString } from '@/lib/investmentCalendarCalc';

interface RightsDateCountdownProps {
  stockCalendarData: CalendarDataMap;
  onStockClick: (symbol: string) => void;
}

interface RightsItem {
  symbol: string;
  name: string;
  type: 'dividend' | 'shareholder';
  confirmationDate: string;
  lastDate: string;
  daysUntilConfirmation: number;
  daysUntilLast: number;
}

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

function buildRightsItem(
  symbol: string,
  name: string,
  type: 'dividend' | 'shareholder',
  settings: RightsDateSettings
): RightsItem | null {
  const confirmationDate = calculateRightsDateFromSettings(settings);
  if (!confirmationDate) return null;

  const daysUntilConfirmation = calculateDaysUntil(confirmationDate);
  if (daysUntilConfirmation < 0 || daysUntilConfirmation > 60) return null;

  const lastDate = formatDateString(calculateRightsLastDate(new Date(confirmationDate)));
  const daysUntilLast = calculateDaysUntil(lastDate);

  return { symbol, name, type, confirmationDate, lastDate, daysUntilConfirmation, daysUntilLast };
}

export default function RightsDateCountdown({ stockCalendarData, onStockClick }: RightsDateCountdownProps) {
  const rightsItems = useMemo<RightsItem[]>(() => {
    const items: RightsItem[] = [];

    for (const [symbol, data] of Object.entries(stockCalendarData)) {
      const dividendItem = buildRightsItem(symbol, data.name, 'dividend', data.dividendRightsSettings);
      if (dividendItem) items.push(dividendItem);

      const shareholderItem = buildRightsItem(symbol, data.name, 'shareholder', data.shareholderRightsSettings);
      if (shareholderItem) items.push(shareholderItem);
    }

    return items.sort((a, b) => a.daysUntilLast - b.daysUntilLast);
  }, [stockCalendarData]);

  if (rightsItems.length === 0) return null;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 mb-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎯</span>
        <h3 className="text-base font-semibold text-white">権利確定日カウントダウン</h3>
        <span className="text-xs text-gray-400">({rightsItems.length}件)</span>
      </div>

      <div className="space-y-2">
        {rightsItems.map((item) => {
          const style = getUrgencyStyle(item.daysUntilLast);
          const icon = item.type === 'dividend' ? '💰' : '🎁';
          const typeLabel = item.type === 'dividend' ? '配当' : '優待';

          return (
            <button
              key={`${item.symbol}-${item.type}`}
              onClick={() => onStockClick(item.symbol)}
              className={`cursor-pointer w-full text-left p-3 rounded-lg border ${style.border} ${style.bg} transition-all duration-200 hover:scale-[1.01] ${style.pulse ? 'animate-pulse' : ''}`}
              style={{ boxShadow: style.glow }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{icon}</span>
                  <span className={`text-sm font-bold ${style.text} shrink-0`}>
                    {item.daysUntilLast <= 0 ? '期限切れ' : `${item.daysUntilLast}日後`}
                  </span>
                  <span className="text-xs text-gray-400 shrink-0">{typeLabel}権利確定</span>
                  <span className="text-xs text-gray-300 truncate font-medium">{item.name}({item.symbol})</span>
                </div>
                <span className="text-xs text-gray-500 shrink-0 ml-2">{formatDate(item.confirmationDate)}</span>
              </div>
              <div className="mt-1 ml-6 text-xs text-gray-500">
                └ 権利付き最終日: {formatDate(item.lastDate)}
                {item.daysUntilLast > 0 && ` (あと${item.daysUntilLast}日)`}
                {item.daysUntilLast === 0 && ' (本日!)'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
