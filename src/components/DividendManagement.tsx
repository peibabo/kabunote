'use client';

import { PositionSummary, formatPrice, formatShares } from '@/types/positions';
import { DividendRightsSettings, calculateDividendRightsDateFromSettings, createDefaultDividendRightsSettings } from '@/types/rightsDate';
import { calculateDividendInfo, formatDividendAmount, formatDividendYield } from '@/types/dividend';
import { useStringLocalStorage } from '@/hooks/useLocalStorage';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface DividendManagementProps {
  symbol: string;
  positionSummary: PositionSummary;
  dividendRightsSettings: DividendRightsSettings;
  onDividendRightsSettingsChange: (settings: DividendRightsSettings) => void;
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

// ステータスに応じたCSSクラス
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

export default function DividendManagement({
  symbol,
  positionSummary,
  dividendRightsSettings,
  onDividendRightsSettingsChange
}: DividendManagementProps) {
  // 配当情報の状態管理
  const [dividendPerShare, setDividendPerShare] = useStringLocalStorage(`kabunote-dividend-per-share-${symbol}`, '', 300);
  const [dividendFrequency, setDividendFrequency] = useStringLocalStorage(`kabunote-dividend-frequency-${symbol}`, '1', 300);

  // 配当計算
  const dividendCalculation = (() => {
    const perShare = parseFloat(dividendPerShare);
    const frequency = parseInt(dividendFrequency) as 1 | 2 | 4;

    if (!perShare || perShare <= 0 || positionSummary.totalShares === 0) {
      return null;
    }

    return calculateDividendInfo(
      perShare,
      frequency,
      positionSummary.totalShares,
      positionSummary.averagePrice
    );
  })();

  // 配当権利確定日の取得
  const dividendRightsDate = calculateDividendRightsDateFromSettings(dividendRightsSettings);
  const rightsCountdown = getRightsCountdown(dividendRightsDate);

  // 月/日の変更ハンドラー
  const handleMonthChange = (value: string) => {
    const month = value ? parseInt(value) : null;
    onDividendRightsSettingsChange({
      ...dividendRightsSettings,
      month,
      isActive: month !== null && dividendRightsSettings.day !== null
    });
  };

  const handleDayChange = (value: string) => {
    const day = value ? parseInt(value) : null;
    onDividendRightsSettingsChange({
      ...dividendRightsSettings,
      day,
      isActive: dividendRightsSettings.month !== null && day !== null
    });
  };

  const handleRecurringChange = (isRecurring: boolean) => {
    onDividendRightsSettingsChange({
      ...dividendRightsSettings,
      isRecurring
    });
  };

  return (
    <div className="space-y-4">
      {positionSummary.totalShares === 0 && (
      <div className="text-xs text-gray-400 text-center mt-1">配当権利確定日を入力すると投資タイムラインで<br></br>日程を確認できるようになります</div>
      )}
      {/* 配当権利確定日設定 */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-green-300">
          配当権利確定日
        </label>

        {/* 月/日入力 */}
        <div className="flex items-center space-x-2">
          <select
            value={dividendRightsSettings.month || ''}
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
            value={dividendRightsSettings.day || ''}
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
              checked={dividendRightsSettings.isRecurring}
              onChange={(e) => handleRecurringChange(e.target.checked)}
              className="w-3 h-3 text-green-500 bg-gray-700 border-gray-600 rounded focus:ring-green-400 focus:ring-1"
            />
            <span className="text-xs font-thin text-gray-300 flex items-center space-x-1">
              <span>毎年</span>
              <span className="text-green-400">↻</span>
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

      {/* 配当情報 */}
      <div className="space-y-3">
        {/* ポジションが未設定時の誘導メッセージ */}
        {positionSummary.totalShares === 0 ? (
          <div className="text-center bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg px-2 py-2">
            <div className="text-xs text-yellow-300 mb-1">配当計算</div>
            <div className="text-sm font-medium text-gray-400 mb-1">
              ---
            </div>
            <div className="text-xs text-yellow-400">
              💡 株式を保有している場合は、先に保有状況タブから<br></br>ポジションを設定してください
            </div>
          </div>
        ) : (
          <>
            {/* 配当金入力フィールド */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor={`dividend-per-share-${symbol}`} className="text-xs font-medium text-green-300">
                  1株当たり配当金
                </label>
                <div className="relative">
                  <input
                    id={`dividend-per-share-${symbol}`}
                    type="number"
                    value={dividendPerShare}
                    onChange={(e) => setDividendPerShare(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none text-sm pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor={`dividend-frequency-${symbol}`} className="text-xs font-medium text-green-300">
                  配当頻度
                </label>
                <select
                  id={`dividend-frequency-${symbol}`}
                  value={dividendFrequency}
                  onChange={(e) => setDividendFrequency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none text-sm"
                >
                  <option value="1">年1回</option>
                  <option value="2">年2回</option>
                  <option value="4">年4回</option>
                </select>
              </div>
            </div>

            {/* 配当計算結果 */}
            {dividendCalculation ? (
              <div className="bg-green-900 bg-opacity-30 rounded-lg p-3">
                <h5 className="text-xs font-medium text-green-300 mb-2">💰 配当シミュレーション</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">年間配当金額：</span>
                    <div className="text-green-300 font-medium">{formatDividendAmount(dividendCalculation.annualDividend)}円</div>
                    <div className="text-xs text-gray-400">
                      {dividendPerShare}円 × {positionSummary.totalShares}株 × {dividendFrequency}回
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">配当利回り：</span>
                    <div className="text-green-300 font-medium">{formatDividendYield(dividendCalculation.dividendYield)}%</div>
                    <div className="text-xs text-gray-400">
                      年間配当 ÷ 平均取得価額
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">税引後受取額：</span>
                    <div className="text-blue-300 font-medium">{formatDividendAmount(dividendCalculation.afterTaxAmount)}円</div>
                    <div className="text-xs text-gray-400">
                      税率20.315%控除後
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">税金額：</span>
                    <div className="text-red-300 font-medium">{formatDividendAmount(dividendCalculation.taxAmount)}円</div>
                    <div className="text-xs text-gray-400">
                      源泉徴収額
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              dividendPerShare ? (
                <div className="text-center bg-green-900 bg-opacity-20 border border-green-700 rounded-lg px-2 py-2">
                  <div className="text-xs text-green-300 mb-1">配当シミュレーション</div>
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    ---
                  </div>
                  <div className="text-xs text-green-400">
                    💡 正しい配当金額を入力してください
                  </div>
                </div>
              ) : (
                <div className="text-center bg-green-900 bg-opacity-20 border border-green-700 rounded-lg px-2 py-2">
                  <div className="text-xs text-green-300 mb-1">配当シミュレーション</div>
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    ---
                  </div>
                  <div className="text-xs text-green-400">
                    💡 配当金を入力してください
                  </div>
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}