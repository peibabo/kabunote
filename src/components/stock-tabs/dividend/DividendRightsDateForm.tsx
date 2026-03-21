'use client';

import { playSound } from '@/lib/sound';
import { DividendRightsSettings } from '@/types/rightsDate';
import { calculateRightsDateFromSettings } from '@/types/rightsDate';
import { calculateRightsLastDay, getDayOfWeek } from '@/lib/investmentCalendarCalc';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

// 権利付き最終日カウントダウン計算ロジック（権利確定日ベース）
const getRightsCountdown = (rightsDate: string): EarningsCountdown | null => {
  if (!rightsDate) return null;

  const today = new Date();
  const confirmationDate = new Date(rightsDate);
  const lastDay = calculateRightsLastDay(rightsDate);

  if (!lastDay) return null;

  const timeDiff = lastDay.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  const lastMonth = lastDay.getMonth() + 1;
  const lastDate = lastDay.getDate();
  const lastDayOfWeek = getDayOfWeek(lastDay);
  const formattedLastDay = `${lastMonth}/${lastDate}(${lastDayOfWeek})`;

  const confMonth = confirmationDate.getMonth() + 1;
  const confDate = confirmationDate.getDate();
  const formattedConfDate = `${confMonth}/${confDate}`;

  if (daysDiff > 0) {
    return {
      text: `\u6700\u7D42\u65E5\uFF1A${formattedLastDay}\uFF08\u3042\u3068${daysDiff}\u65E5\uFF09 \u78BA\u5B9A\u65E5\uFF1A${formattedConfDate}`,
      status: daysDiff <= 7 ? 'urgent' : 'normal'
    };
  } else if (daysDiff === 0) {
    return {
      text: `\u6700\u7D42\u65E5\uFF1A${formattedLastDay}\uFF08\u672C\u65E5\uFF09 \u78BA\u5B9A\u65E5\uFF1A${formattedConfDate}`,
      status: 'today'
    };
  } else {
    return {
      text: `\u6700\u7D42\u65E5\u7D42\u4E86\uFF1A${formattedLastDay}\uFF08${Math.abs(daysDiff)}\u65E5\u524D\uFF09 \u78BA\u5B9A\u65E5\uFF1A${formattedConfDate}`,
      status: 'past'
    };
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'urgent':
      return 'bg-red-600 text-red-100 border-red-500';
    case 'today':
      return 'bg-yellow-600 text-yellow-100 border-yellow-500 animate-pulse';
    case 'normal':
      return 'bg-blue-600 text-blue-100 border-blue-500';
    case 'past':
      return 'bg-gray-600 text-gray-300 border-gray-500';
    default:
      return 'bg-gray-600 text-gray-300 border-gray-500';
  }
};

interface DividendRightsDateFormProps {
  dividendRightsSettings: DividendRightsSettings;
  onMonthChange: (value: string) => void;
  onDayChange: (value: string) => void;
  onRecurringChange: (isRecurring: boolean) => void;
}

export default function DividendRightsDateForm({
  dividendRightsSettings,
  onMonthChange,
  onDayChange,
  onRecurringChange,
}: DividendRightsDateFormProps) {
  const dividendRightsDate = calculateRightsDateFromSettings(dividendRightsSettings);
  const rightsCountdown = getRightsCountdown(dividendRightsDate);

  return (
    <>
      <div className="space-y-3">
        <label className="text-xs font-medium text-green-300">
          配当権利確定日
        </label>

        <div className="flex items-center space-x-2">
          <select
            value={dividendRightsSettings.month || ''}
            onChange={(e) => onMonthChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-green-400 focus:outline-none"
          >
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>{month}月</option>
            ))}
          </select>
          <span className="text-gray-400 text-xs font-thin">/</span>
          <select
            value={dividendRightsSettings.day || ''}
            onChange={(e) => onDayChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-green-400 focus:outline-none"
          >
            <option value="">日</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day}>{day}日</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dividendRightsSettings.isRecurring}
              onChange={(e) => onRecurringChange(e.target.checked)}
              className="w-3 h-3 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-400 focus:ring-1"
            />
            <span className="text-xs font-thin text-gray-300 flex items-center space-x-1">
              <span>毎年</span>
              <span className="text-green-400">{'\u21BB'}</span>
            </span>
          </label>
          {!dividendRightsSettings.isRecurring && (
            <span className="text-xs font-thin text-orange-300">今回のみ</span>
          )}
        </div>
      </div>

      {/* 配当権利付き最終日カウントダウン表示 */}
      {rightsCountdown && (
        <div className={`px-3 py-2 rounded-lg border font-medium ${getStatusColor(rightsCountdown.status)}`}>
          <div className="flex items-center gap-1">
            <span className="text-lg">{'\u{1F4B0}'}</span>
            <div className="flex flex-col space-y-0.5">
              <div className="text-sm leading-tight">
                {rightsCountdown.text.split(' \u78BA\u5B9A\u65E5\uFF1A')[0]}
              </div>
              {rightsCountdown.text.includes('\u78BA\u5B9A\u65E5\uFF1A') && (
                <div className="text-xs opacity-75 leading-tight">
                  確定日：{rightsCountdown.text.split(' \u78BA\u5B9A\u65E5\uFF1A')[1]}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
