'use client';

import { PositionSummary } from '@/types/positions';
import { playSound } from '@/lib/sound';
import { useSoundOnChange } from '@/hooks/useSoundOnChange';
import { calculateRightsDateFromSettings } from '@/types/rightsDate';
import { calculateShareholderBenefit, formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';
import { useStockBenefit } from '@/hooks/useStockBenefit';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface ShareholderBenefitManagementProps {
  symbol: string;
  positionSummary: PositionSummary;
  initialBenefit?: {
    description: string | null;
    minimumShares: number | null;
    estimatedValue: number | null;
    rightsMonth: number | null;
    rightsDay: number | null;
  } | null;
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

export default function ShareholderBenefitManagement({
  symbol,
  positionSummary,
  initialBenefit,
}: ShareholderBenefitManagementProps) {
  const {
    description: benefitDescription,
    minimumShares,
    estimatedValue,
    rightsSettings: shareholderRightsSettings,
    updateDescription: setBenefitDescription,
    updateMinimumShares: setMinimumShares,
    updateEstimatedValue: setEstimatedValue,
    updateRightsSettings: onShareholderRightsSettingsChange,
  } = useStockBenefit(`stock-${symbol}`, initialBenefit !== undefined ? { initialData: initialBenefit } : undefined)

  // 株主優待計算
  const shareholderBenefitCalculation = (() => {
    const minShares = parseInt(minimumShares);
    const estValue = parseFloat(estimatedValue);

    if (!minShares || minShares <= 0 || !estValue || estValue <= 0 || positionSummary.totalShares === 0) {
      return null;
    }

    return calculateShareholderBenefit(
      minShares,
      positionSummary.totalShares,
      estValue,
      positionSummary.totalCost
    );
  })();

  // 株主優待権利確定日の取得
  const shareholderRightsDate = calculateRightsDateFromSettings(shareholderRightsSettings);
  const rightsCountdown = getRightsCountdown(shareholderRightsDate);

  // 月/日の変更ハンドラー
  const onChangeSound = useSoundOnChange();

  const handleMonthChange = (value: string) => {
    playSound('select');
    const month = value ? parseInt(value) : null;
    onShareholderRightsSettingsChange({
      ...shareholderRightsSettings,
      month,
      isActive: month !== null && shareholderRightsSettings.day !== null
    });
  };

  const handleDayChange = (value: string) => {
    playSound('select');
    const day = value ? parseInt(value) : null;
    onShareholderRightsSettingsChange({
      ...shareholderRightsSettings,
      day,
      isActive: shareholderRightsSettings.month !== null && day !== null
    });
  };

  const handleRecurringChange = (isRecurring: boolean) => {
    playSound('toggle');
    onShareholderRightsSettingsChange({
      ...shareholderRightsSettings,
      isRecurring
    });
  };

  return (
    <div className="space-y-4">
      {positionSummary.totalShares === 0 && (
      <div className="text-xs text-gray-400 text-center mt-1">株主優待権利確定日を入力すると投資タイムラインで<br></br>日程を確認できるようになります</div>
      )}
      {/* 株主優待権利確定日設定 */}
      <div className="space-y-3">
        <label className="text-xs font-medium text-purple-300">
          株主優待権利確定日
        </label>

        {/* 月/日入力 */}
        <div className="flex items-center space-x-2">
          <select
            value={shareholderRightsSettings.month || ''}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-purple-400 focus:outline-none"
          >
            <option value="">月</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>{month}月</option>
            ))}
          </select>
          <span className="text-gray-400 text-xs font-thin">/</span>
          <select
            value={shareholderRightsSettings.day || ''}
            onChange={(e) => handleDayChange(e.target.value)}
            className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-600 rounded text-white text-xs font-thin focus:border-purple-400 focus:outline-none"
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
              checked={shareholderRightsSettings.isRecurring}
              onChange={(e) => handleRecurringChange(e.target.checked)}
              className="w-3 h-3 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-400 focus:ring-1"
            />
            <span className="text-xs font-thin text-gray-300 flex items-center space-x-1">
              <span>毎年</span>
              <span className="text-purple-400">↻</span>
            </span>
          </label>
          {!shareholderRightsSettings.isRecurring && (
            <span className="text-xs font-thin text-orange-300">今回のみ</span>
          )}
        </div>
      </div>

      {/* 株主優待権利付き最終日カウントダウン表示 */}
      {rightsCountdown && (
        <div className={`px-3 py-2 rounded-lg border font-medium ${getStatusColor(rightsCountdown.status)}`}>
          <div className="flex items-center gap-1">
            <span className="text-lg">🎁</span>
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

      {/* 株主優待情報 */}
      <div className="space-y-3">
        {/* ポジションが未設定時の誘導メッセージ */}
        {positionSummary.totalShares === 0 ? (
          <div className="text-center bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg px-2 py-2">
            <div className="text-xs text-purple-300 mb-1">優待シミュレーション</div>
            <div className="text-sm font-medium text-gray-400 mb-1">
              ---
            </div>
            <div className="text-xs text-purple-400">
              💡 株式を保有している場合は、先に保有状況タブから<br></br>ポジションを設定してください
            </div>
          </div>
        ) : (
          <>
            {/* 株主優待情報入力フィールド */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor={`benefit-description-${symbol}`} className="text-xs font-medium text-purple-300">
                  優待内容
                </label>
                <input
                  id={`benefit-description-${symbol}`}
                  type="text"
                  value={benefitDescription}
                  onChange={(e) => { setBenefitDescription(e.target.value); onChangeSound(); }}
                  placeholder="例：お米券1000円分"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor={`minimum-shares-${symbol}`} className="text-xs font-medium text-purple-300">
                    必要株数（100株単位）
                  </label>
                  <div className="relative">
                    <input
                      id={`minimum-shares-${symbol}`}
                      type="number"
                      value={minimumShares ? Math.floor(parseInt(minimumShares) / 100).toString() : ''}
                      onChange={(e) => {
                        const units = e.target.value;
                        const shares = units ? (parseInt(units) * 100).toString() : '';
                        setMinimumShares(shares);
                        onChangeSound();
                      }}
                      placeholder="1"
                      title="100株単位で入力してください（例：1 = 100株、5 = 500株）"
                      min="1"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm pr-12"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400">×100株</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor={`estimated-value-${symbol}`} className="text-xs font-medium text-purple-300">
                    優待推定価値
                  </label>
                  <div className="relative">
                    <input
                      id={`estimated-value-${symbol}`}
                      type="number"
                      value={estimatedValue}
                      onChange={(e) => { setEstimatedValue(e.target.value); onChangeSound(); }}
                      placeholder="1000"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm pr-8"
                    />
                    <span className="absolute right-3 top-2 text-xs text-gray-400">円</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 株主優待計算結果 */}
            {shareholderBenefitCalculation ? (
              <div className="bg-purple-900 bg-opacity-30 rounded-lg p-3">
                <h5 className="text-xs font-medium text-purple-300 mb-2">優待シミュレーション</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">取得資格：</span>
                    <div className={`font-medium ${shareholderBenefitCalculation.isEligible ? 'text-purple-300' : 'text-orange-300'}`}>
                      {shareholderBenefitCalculation.isEligible ? '✓ 有資格' : '✗ 要追加購入'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {shareholderBenefitCalculation.currentShares}株 / {shareholderBenefitCalculation.minimumShares}株
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">優待利回り：</span>
                    <div className="text-purple-300 font-medium">{formatBenefitYield(shareholderBenefitCalculation.yieldOnInvestment)}%</div>
                    <div className="text-xs text-gray-400">
                      年間優待価値 ÷ 総投資額
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">年間優待価値：</span>
                    <div className="text-purple-300 font-medium">{formatBenefitValue(shareholderBenefitCalculation.estimatedValue)}円</div>
                    <div className="text-xs text-gray-400">
                      推定価値（年1回）
                    </div>
                  </div>
                  {!shareholderBenefitCalculation.isEligible && (
                    <div>
                      <span className="text-gray-400">不足株数：</span>
                      <div className="text-orange-300 font-medium">{shareholderBenefitCalculation.shortfall}株</div>
                      <div className="text-xs text-gray-400">
                        追加購入で取得可能
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              (minimumShares && estimatedValue) ? (
                <div className="text-center bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg px-2 py-2">
                  <div className="text-xs text-purple-300 mb-1">優待シミュレーション</div>
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    ---
                  </div>
                  <div className="text-xs text-purple-400">
                    💡 正しい値を入力してください
                  </div>
                </div>
              ) : (
                <div className="text-center bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg px-2 py-2">
                  <div className="text-xs text-purple-300 mb-1">優待シミュレーション</div>
                  <div className="text-sm font-medium text-gray-400 mb-1">
                    ---
                  </div>
                  <div className="text-xs text-purple-400">
                    💡 優待情報を入力してください
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
