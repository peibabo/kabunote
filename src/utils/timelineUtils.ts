/**
 * 投資タイムライン用ユーティリティ関数
 *
 * InvestmentTimeline コンポーネントから抽出した純粋関数群
 */

import { InvestmentEvent } from '@/types/investmentCalendar';
import { formatDateString } from '@/lib/investmentCalendarCalc';

// ─────────────────────────────────────────
// イベントスタイル定義
// ─────────────────────────────────────────

interface EventStyle {
  color: string;
  size: string;
  glow: string;
  priority: number;
  opacity: string;
  animation: string;
}

/**
 * イベントタイプ・過去/未来・直近日数からスタイルを返す
 */
export const getEventStyle = (
  type: InvestmentEvent['type'],
  isPast: boolean,
  daysFromToday: number
): EventStyle => {
  const baseStyle: Record<string, Omit<EventStyle, 'opacity' | 'animation'>> = {
    earnings: {
      color: 'bg-red-500',
      size: 'w-4 h-4',
      glow: 'shadow-red-500/50',
      priority: 3
    },
    'dividend-rights-last': {
      color: 'bg-green-400',
      size: 'w-3 h-3',
      glow: 'shadow-green-400/50',
      priority: 2
    },
    'dividend-rights-confirmation': {
      color: 'bg-green-600',
      size: 'w-3 h-3',
      glow: 'shadow-green-600/50',
      priority: 2
    },
    'shareholder-rights-last': {
      color: 'bg-purple-400',
      size: 'w-3 h-3',
      glow: 'shadow-purple-400/50',
      priority: 1
    },
    'shareholder-rights-confirmation': {
      color: 'bg-purple-600',
      size: 'w-3 h-3',
      glow: 'shadow-purple-600/50',
      priority: 1
    },
    'shareholder-meeting': {
      color: 'bg-blue-500',
      size: 'w-3 h-3',
      glow: 'shadow-blue-500/50',
      priority: 1
    },
  };

  const style = baseStyle[type] ?? baseStyle['shareholder-meeting'];

  // 過去のイベントは透明度を下げる
  if (isPast) {
    return { ...style, opacity: 'opacity-40', animation: '' };
  }

  // 直近7日のイベントは光らせる
  if (daysFromToday >= 0 && daysFromToday <= 7) {
    return { ...style, opacity: 'opacity-100', animation: 'animate-pulse' };
  }

  // 将来のイベント（7日より先）
  return { ...style, opacity: 'opacity-80', animation: '' };
};

// ─────────────────────────────────────────
// 日付ラベル表示判定
// ─────────────────────────────────────────

/**
 * タイムライン上で日付ラベルを表示するかを判定する
 */
export const shouldShowDateLabel = (date: Date, index: number): boolean => {
  // 今日は必ず表示
  const today = new Date();
  if (formatDateString(date) === formatDateString(today)) return true;

  // 月の1日は表示
  if (date.getDate() === 1) return true;

  // 月曜日かつ週の最初（7日ごと）は表示
  if (date.getDay() === 1 && index % 7 === 0) return true;

  return false;
};

// ─────────────────────────────────────────
// 営業日計算
// ─────────────────────────────────────────

/**
 * 指定した営業日数前の日付を返す（土日を除外して遡る）
 */
export const calculateBusinessDaysBefore = (date: Date, businessDays: number): Date => {
  const result = new Date(date);
  let remainingDays = businessDays;

  while (remainingDays > 0) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }

  return result;
};

// ─────────────────────────────────────────
// イベントドット色
// ─────────────────────────────────────────

/**
 * カレンダードット表示用の Tailwind クラスを返す
 */
export const getEventDotColor = (type: InvestmentEvent['type']): string => {
  switch (type) {
    case 'earnings':                     return 'bg-red-500';
    case 'dividend-rights-last':         return 'bg-green-400';
    case 'dividend-rights-confirmation': return 'bg-green-600';
    case 'shareholder-rights-last':      return 'bg-purple-400';
    case 'shareholder-rights-confirmation': return 'bg-purple-600';
    case 'shareholder-meeting':          return 'bg-blue-500';
    default:                             return 'bg-gray-400';
  }
};
