'use client';

import { Position, PositionSummary, formatPrice, formatShares } from '@/types/positions';
import { RightsDateSettings } from '@/types/rightsDate';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface ManagementTabProps {
  symbol: string;
  earningsDate: string;
  onEarningsDateChange: (value: string) => void;
  rightsDate: string;
  rightsSettings: RightsDateSettings;
  onRightsSettingsChange: (settings: RightsDateSettings) => void;
  positions: Position[];
  positionSummary: PositionSummary;
  onPositionManagerOpen: () => void;
}

// 土日を除いた営業日前を計算する関数
const calculateBusinessDaysBefore = (date: Date, businessDays: number): Date => {
  const result = new Date(date);
  let remainingDays = businessDays;

  while (remainingDays > 0) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    // 土曜日(6)と日曜日(0)以外の場合にカウント
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }

  return result;
};

// 曜日を取得する関数
const getDayOfWeek = (date: Date): string => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

// 権利付き最終日（権利確定日の2営業日前）を計算
const calculateRightsLastDay = (rightsDate: string): Date | null => {
  if (!rightsDate) return null;
  const confirmationDate = new Date(rightsDate);
  return calculateBusinessDaysBefore(confirmationDate, 2);
};

// 決算カウントダウン計算ロジック
const getEarningsCountdown = (earningsDate: string): EarningsCountdown | null => {
  if (!earningsDate) return null;

  const today = new Date();
  const earnings = new Date(earningsDate);
  const timeDiff = earnings.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // 決算日のフォーマット表示（M/D形式）
  const month = earnings.getMonth() + 1;
  const day = earnings.getDate();
  const formattedDate = `${month}/${day}`;

  if (daysDiff > 0) {
    return {
      text: `次回の決算日：${formattedDate}（あと${daysDiff}日）`,
      status: daysDiff <= 7 ? 'urgent' : 'normal'
    };
  } else if (daysDiff === 0) {
    return {
      text: `決算発表日：${formattedDate}（本日）`,
      status: 'today'
    };
  } else {
    return {
      text: `前回の決算日：${formattedDate}（${Math.abs(daysDiff)}日前）`,
      status: 'past'
    };
  }
};

// 権利付き最終日カウントダウン計算ロジック（権利確定日ベース）
const getRightsCountdown = (rightsDate: string): EarningsCountdown | null => {
  if (!rightsDate) return null;

  const today = new Date();
  const confirmationDate = new Date(rightsDate);
  const lastDay = calculateRightsLastDay(rightsDate);

  if (!lastDay) return null;

  const timeDiff = lastDay.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // 権利付き最終日のフォーマット表示（M/D(曜)形式）
  const lastMonth = lastDay.getMonth() + 1;
  const lastDate = lastDay.getDate();
  const lastDayOfWeek = getDayOfWeek(lastDay);
  const formattedLastDay = `${lastMonth}/${lastDate}(${lastDayOfWeek})`;

  // 権利確定日のフォーマット表示（M/D形式）
  const confMonth = confirmationDate.getMonth() + 1;
  const confDate = confirmationDate.getDate();
  const formattedConfDate = `${confMonth}/${confDate}`;

  if (daysDiff > 0) {
    return {
      text: `最終日：${formattedLastDay}（あと${daysDiff}日） 確定日：${formattedConfDate}`,
      status: daysDiff <= 7 ? 'urgent' : 'normal'
    };
  } else if (daysDiff === 0) {
    return {
      text: `最終日：${formattedLastDay}（本日） 確定日：${formattedConfDate}`,
      status: 'today'
    };
  } else {
    return {
      text: `最終日終了：${formattedLastDay}（${Math.abs(daysDiff)}日前） 確定日：${formattedConfDate}`,
      status: 'past'
    };
  }
};

// 決算ステータスに応じたCSSクラス
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

export default function ManagementTab({
  symbol,
  earningsDate,
  onEarningsDateChange,
  rightsDate,
  rightsSettings,
  onRightsSettingsChange,
  positions,
  positionSummary,
  onPositionManagerOpen
}: ManagementTabProps) {
  const countdown = getEarningsCountdown(earningsDate);
  const rightsCountdown = getRightsCountdown(rightsDate);

  // 月/日の変更ハンドラー
  const handleMonthChange = (value: string) => {
    const month = value ? parseInt(value) : null;
    onRightsSettingsChange({
      ...rightsSettings,
      month,
      isActive: month !== null && rightsSettings.day !== null
    });
  };

  const handleDayChange = (value: string) => {
    const day = value ? parseInt(value) : null;
    onRightsSettingsChange({
      ...rightsSettings,
      day,
      isActive: rightsSettings.month !== null && day !== null
    });
  };

  const handleRecurringChange = (isRecurring: boolean) => {
    onRightsSettingsChange({
      ...rightsSettings,
      isRecurring
    });
  };

  return (
    <div className="space-y-4">
      {/* 管理タブ: ポジション・決算情報 */}
      {/* 決算情報 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-300">決算情報</h4>

        {/* 決算日設定 */}
        <div className="space-y-2">
          <label htmlFor={`earnings-date-${symbol}`} className="text-xs font-medium text-blue-300">
            📅 決算発表日
          </label>
          <input
            id={`earnings-date-${symbol}`}
            type="date"
            value={earningsDate}
            onChange={(e) => onEarningsDateChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>

        {/* 決算カウントダウン表示 */}
        {countdown && (
          <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(countdown.status)}`}>
            📈 {countdown.text}
          </div>
        )}

        {/* 権利確定日設定（月/日形式） */}
        <div className="space-y-3">
          <label className="text-xs font-thin text-green-300">
            💰 権利確定日
          </label>

          {/* 月/日入力 */}
          <div className="flex items-center space-x-2">
            <select
              value={rightsSettings.month || ''}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-green-400 focus:outline-none"
            >
              <option value="">月</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{month}月</option>
              ))}
            </select>
            <span className="text-gray-400 text-xs font-thin">/</span>
            <select
              value={rightsSettings.day || ''}
              onChange={(e) => handleDayChange(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-green-400 focus:outline-none"
            >
              <option value="">日</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>{day}日</option>
              ))}
            </select>
          </div>

          {/* 繰り返し設定 */}
          <div className="flex items-center space-x-2 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rightsSettings.isRecurring}
                onChange={(e) => handleRecurringChange(e.target.checked)}
                className="w-3 h-3 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-400 focus:ring-1"
              />
              <span className="text-xs font-thin text-gray-300 flex items-center space-x-1">
                <span>毎年</span>
                <span className="text-green-400">↻</span>
              </span>
            </label>
            {!rightsSettings.isRecurring && (
              <span className="text-xs font-thin text-orange-300">今回のみ</span>
            )}
          </div>
        </div>

        {/* 権利付き最終日カウントダウン表示 */}
        {rightsCountdown && (
          <div className={`px-3 py-2 rounded-lg border font-medium ${getStatusColor(rightsCountdown.status)}`}>
            <div className="flex items-center gap-1">
              <span className="text-lg">💰</span>
              <div className="flex flex-col space-y-0.5">
                <div className="text-sm leading-tight">
                  {rightsCountdown.text.split(' 確定日：')[0]}
                </div>
                {rightsCountdown.text.includes('確定日：') && (
                  <div className="text-xs opacity-75 leading-tight">
                    確定日：{rightsCountdown.text.split(' 確定日：')[1]}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ポジション管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-300">保有ポジション</h4>
          <button
            onClick={onPositionManagerOpen}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded transition-colors"
          >
            ポジション管理
          </button>
        </div>

        {positions.length > 0 ? (
          <div className="bg-gray-700 rounded-lg p-3 space-y-2">
            {/* ポジションサマリー */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400">保有株数：</span>
                <span className="text-white font-medium">{formatShares(positionSummary.totalShares)}株</span>
              </div>
              <div>
                <span className="text-gray-400">平均取得：</span>
                <span className="text-green-300 font-medium">{formatPrice(positionSummary.averagePrice)}円</span>
              </div>
              <div>
                <span className="text-gray-400">総投資額：</span>
                <span className="text-blue-300 font-medium">{formatPrice(positionSummary.totalCost)}円</span>
              </div>
              <div>
                <span className="text-gray-400">ポジション数：</span>
                <span className="text-gray-200">{positionSummary.positionCount}件</span>
              </div>
            </div>

            {/* ポジション一覧（簡易表示） */}
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {positions.map((position) => (
                <div key={position.id} className="flex justify-between items-center text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded">
                  <span>{formatShares(position.shares)}株 @ {formatPrice(position.purchasePrice)}円</span>
                  <span>{position.purchaseDate}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            保有ポジションが登録されていません
          </div>
        )}
      </div>
    </div>
  );
}