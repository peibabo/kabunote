'use client';

import { SnoozeDuration } from '@/types/snooze';
import { SNOOZE_DURATIONS, getTimeUntilUnsnooze, generateAlertKey } from '@/lib/snoozeCalc';
import {
  getAlertStyles,
  formatAlertPrice,
  type AlertRowData,
} from '@/hooks/alert/useAlertSummaryData';

interface AlertMobileCardProps {
  alert: AlertRowData;
  showSnoozed: boolean;
  snoozedAlerts: { symbol: string; alertType: string; snoozeUntil: number }[];
  onSnooze: (alert: AlertRowData, duration: SnoozeDuration) => void;
  onUnsnooze: (alertKey: string) => void;
}

export default function AlertMobileCard({ alert, showSnoozed, snoozedAlerts, onSnooze, onUnsnooze }: AlertMobileCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="font-medium text-white text-sm">{alert.symbol}</span>
          <span className="text-xs text-gray-400 ml-2 truncate">{alert.companyName}</span>
        </div>
      </div>
      <div className={`px-3 py-1.5 rounded-lg border text-xs mb-2 ${getAlertStyles(alert.alertType)}`}>
        {alert.alertMessage}
        {alert.alertDetail && (
          <span className="ml-2 text-gray-300">({alert.alertDetail})</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">現在価格: </span>
          <span className="text-white">{formatAlertPrice(alert.currentPrice)}円</span>
        </div>
        <div>
          <span className="text-gray-400">対象価格: </span>
          <span className="text-white">
            {alert.targetPrice ? `${formatAlertPrice(alert.targetPrice)}円` :
             alert.stopLossPrice ? `${formatAlertPrice(alert.stopLossPrice)}円` : '-'}
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700">
        {!showSnoozed ? (
          <select
            onChange={(e) => {
              if (e.target.value) {
                onSnooze(alert, parseInt(e.target.value) as SnoozeDuration);
                e.target.value = '';
              }
            }}
            className="w-full bg-gray-700 text-gray-300 text-xs px-2 py-1.5 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            defaultValue=""
          >
            <option value="" disabled>💤 スヌーズ</option>
            {SNOOZE_DURATIONS.map(({ value, label, icon }) => (
              <option key={value} value={value}>{icon} {label}</option>
            ))}
          </select>
        ) : (() => {
          const snoozedAlert = snoozedAlerts.find(
            s => s.symbol === alert.symbol && s.alertType === alert.alertType
          );
          if (!snoozedAlert) return <span className="text-xs text-gray-500">-</span>;
          return (
            <div className="flex items-center justify-between">
              <span className="text-xs text-blue-400">
                {getTimeUntilUnsnooze(snoozedAlert.snoozeUntil)}
              </span>
              <button
                onClick={() => onUnsnooze(generateAlertKey(alert.symbol, alert.alertType))}
                className="cursor-pointer text-xs text-red-400 hover:text-red-300 underline"
              >
                解除
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
