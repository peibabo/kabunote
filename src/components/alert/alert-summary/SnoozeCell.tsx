'use client';

import { SnoozeDuration } from '@/types/snooze';
import { SNOOZE_DURATIONS, getTimeUntilUnsnooze, generateAlertKey } from '@/lib/snoozeCalc';
import type { AlertRowData } from '@/hooks/alert/useAlertSummaryData';

interface SnoozeCellProps {
  alert: AlertRowData;
  showSnoozed: boolean;
  snoozedAlerts: { symbol: string; alertType: string; snoozeUntil: number }[];
  onSnooze: (alert: AlertRowData, duration: SnoozeDuration) => void;
  onUnsnooze: (alertKey: string) => void;
}

export default function SnoozeCell({ alert, showSnoozed, snoozedAlerts, onSnooze, onUnsnooze }: SnoozeCellProps) {
  if (!showSnoozed) {
    return (
      <select
        onChange={(e) => {
          if (e.target.value) {
            onSnooze(alert, parseInt(e.target.value) as SnoozeDuration);
            e.target.value = '';
          }
        }}
        className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded border border-gray-600 hover:bg-gray-600 focus:outline-none focus:border-blue-500"
        defaultValue=""
      >
        <option value="" disabled>💤 スヌーズ</option>
        {SNOOZE_DURATIONS.map(({ value, label, icon }) => (
          <option key={value} value={value}>{icon} {label}</option>
        ))}
      </select>
    );
  }

  const snoozedAlert = snoozedAlerts.find(
    s => s.symbol === alert.symbol && s.alertType === alert.alertType
  );
  if (!snoozedAlert) return <span>-</span>;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-xs text-blue-400">
        {getTimeUntilUnsnooze(snoozedAlert.snoozeUntil)}
      </div>
      <button
        onClick={() => onUnsnooze(generateAlertKey(alert.symbol, alert.alertType))}
        className="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
      >
        解除
      </button>
    </div>
  );
}
