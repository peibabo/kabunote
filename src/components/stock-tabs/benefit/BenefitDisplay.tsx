'use client';

import { calculateRightsLastDay, getDayOfWeek } from '@/lib/investmentCalendarCalc';
import { formatBenefitValue, formatBenefitYield } from '@/lib/shareholderCalc';

interface EarningsCountdown {
  text: string;
  status: 'urgent' | 'today' | 'normal' | 'past';
}

interface ShareholderBenefitCalculation {
  isEligible: boolean;
  currentShares: number;
  minimumShares: number;
  yieldOnInvestment: number;
  estimatedValue: number;
  shortfall: number;
}

interface BenefitDisplayProps {
  rightsDate: string;
  shareholderBenefitCalculation: ShareholderBenefitCalculation | null;
  minimumShares: string;
  estimatedValue: string;
  hasPosition: boolean;
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

export default function BenefitDisplay({
  rightsDate,
  shareholderBenefitCalculation,
  minimumShares,
  estimatedValue,
  hasPosition,
}: BenefitDisplayProps) {
  const rightsCountdown = getRightsCountdown(rightsDate);

  return (
    <>
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

      {/* 株主優待計算結果 */}
      {hasPosition && shareholderBenefitCalculation ? (
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
      ) : hasPosition ? (
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
      ) : (
        <div className="text-center bg-purple-900 bg-opacity-20 border border-purple-700 rounded-lg px-2 py-2">
          <div className="text-xs text-purple-300 mb-1">優待シミュレーション</div>
          <div className="text-sm font-medium text-gray-400 mb-1">
            ---
          </div>
          <div className="text-xs text-purple-400">
            💡 株式を保有している場合は、先に保有状況タブから<br></br>ポジションを設定してください
          </div>
        </div>
      )}
    </>
  );
}
