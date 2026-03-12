'use client';

import { playSound } from '@/lib/sound';
import { ShareholderMeetingSettings, calculateRightsDateFromSettings } from '@/types/rightsDate';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface MeetingCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface EventManagementProps {
  symbol: string;
  earningsDate: string;
  onEarningsDateChange: (value: string) => void;
  shareholderMeetingSettings: ShareholderMeetingSettings;
  onShareholderMeetingSettingsChange: (settings: ShareholderMeetingSettings) => void;
}

// 決算カウントダウン計算ロジック
const getEarningsCountdown = (earningsDate: string): EarningsCountdown | null => {
  if (!earningsDate) return null;

  const today = new Date();
  const earnings = new Date(earningsDate);
  const timeDiff = earnings.getTime() - today.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

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

// 株主総会カウントダウン計算ロジック（決算日と同じロジック）
const getMeetingCountdown = (meetingDate: string): MeetingCountdown | null => {
  if (!meetingDate) return null;

  const today = new Date();
  const meeting = new Date(meetingDate);
  const timeDiff = meeting.getTime() - today.getTime();
  const daysDiff = Math.round(timeDiff / (1000 * 3600 * 24));

  // 株主総会日のフォーマット表示（M/D形式）
  const month = meeting.getMonth() + 1;
  const day = meeting.getDate();
  const formattedDate = `${month}/${day}`;

  if (daysDiff > 0) {
    return {
      text: `次回の株主総会：${formattedDate}（あと${daysDiff}日）`,
      status: daysDiff <= 7 ? 'urgent' : 'normal'
    };
  } else if (daysDiff === 0) {
    return {
      text: `株主総会：${formattedDate}（本日）`,
      status: 'today'
    };
  } else {
    return {
      text: `前回の株主総会：${formattedDate}（${Math.abs(daysDiff)}日前）`,
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

export default function EventManagement({
  symbol,
  earningsDate,
  onEarningsDateChange,
  shareholderMeetingSettings,
  onShareholderMeetingSettingsChange
}: EventManagementProps) {
  const countdown = getEarningsCountdown(earningsDate);

  // 株主総会日を計算
  const shareholderMeetingDate = calculateRightsDateFromSettings(shareholderMeetingSettings);
  const meetingCountdown = getMeetingCountdown(shareholderMeetingDate);

  // 株主総会日の自動無効化チェック（無効化 - ユーザーが手動で管理）
  // useEffect(() => {
  //   // 設定が有効で、単発イベントで、月日が設定されている場合のみチェック
  //   if (!shareholderMeetingSettings.isActive ||
  //       shareholderMeetingSettings.isRecurring ||
  //       shareholderMeetingSettings.month === null ||
  //       shareholderMeetingSettings.day === null) {
  //     return; // 条件に合わない場合は何もしない
  //   }

  //   const today = new Date();
  //   const currentYear = today.getFullYear();

  //   // ISO形式で日付を作成してタイムゾーン問題を回避
  //   const dateString = `${currentYear}-${shareholderMeetingSettings.month.toString().padStart(2, '0')}-${shareholderMeetingSettings.day.toString().padStart(2, '0')}`;
  //   const eventDate = new Date(dateString);

  //   today.setHours(0, 0, 0, 0);
  //   eventDate.setHours(0, 0, 0, 0);

  //   // イベント日が今日より過去の場合のみ無効化
  //   if (eventDate < today) {
  //     console.log('株主総会自動無効化:', { dateString, eventDate, today });
  //     const updatedSettings = { ...shareholderMeetingSettings, isActive: false };
  //     onShareholderMeetingSettingsChange(updatedSettings);
  //   }
  // }, [shareholderMeetingSettings.isActive, shareholderMeetingSettings.isRecurring, shareholderMeetingSettings.month, shareholderMeetingSettings.day, onShareholderMeetingSettingsChange]);

  return (
    <div className="space-y-4">
      {/* 決算日設定 */}
      <div className="space-y-2">
        <label htmlFor={`earnings-date-${symbol}`} className="text-xs font-medium text-blue-300">
          決算発表日
        </label>
        <input
          id={`earnings-date-${symbol}`}
          type="date"
          value={earningsDate}
          onChange={(e) => { playSound('select'); onEarningsDateChange(e.target.value); }}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none text-sm"
        />
      </div>

      {/* 決算カウントダウン表示 */}
      {countdown && (
        <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(countdown.status)}`}>
          📈 {countdown.text}
        </div>
      )}

      {/* 株主総会日設定 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-blue-300">
            株主総会日
          </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shareholderMeetingSettings.isActive}
              onChange={(e) => { playSound('toggle'); onShareholderMeetingSettingsChange({
                ...shareholderMeetingSettings,
                isActive: e.target.checked
              }); }}
              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">設定を有効にする</span>
          </div>
        </div>

        {shareholderMeetingSettings.isActive && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-500/20">
            {/* 月/日選択 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-gray-400">月</label>
                <select
                  value={shareholderMeetingSettings.month || ''}
                  onChange={(e) => { playSound('select'); onShareholderMeetingSettingsChange({
                    ...shareholderMeetingSettings,
                    month: e.target.value ? parseInt(e.target.value) : null
                  }); }}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">選択</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}月</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400">日</label>
                <select
                  value={shareholderMeetingSettings.day || ''}
                  onChange={(e) => { playSound('select'); onShareholderMeetingSettingsChange({
                    ...shareholderMeetingSettings,
                    day: e.target.value ? parseInt(e.target.value) : null
                  }); }}
                  className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">選択</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>{day}日</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 毎年繰り返し設定 */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareholderMeetingSettings.isRecurring}
                onChange={(e) => { playSound('toggle'); onShareholderMeetingSettingsChange({
                  ...shareholderMeetingSettings,
                  isRecurring: e.target.checked
                }); }}
                className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">毎年繰り返し</span>
            </div>
          </div>
        )}

        {/* 株主総会カウントダウン表示 */}
        {meetingCountdown && (
          <div className={`px-3 py-2 rounded-lg border text-sm font-medium ${getStatusColor(meetingCountdown.status)}`}>
            🏛️ {meetingCountdown.text}
          </div>
        )}
      </div>
    </div>
  );
}