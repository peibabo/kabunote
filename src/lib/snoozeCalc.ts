// スヌーズ関連の計算ユーティリティ

import type { SnoozeDuration } from '@/types/snooze';
import { AlertType } from '@/utils/alertSystem';

/**
 * スヌーズ期間の選択肢
 */
export const SNOOZE_DURATIONS: { value: SnoozeDuration; label: string; icon: string }[] = [
  { value: 15, label: '15分', icon: '🕐' },
  { value: 30, label: '30分', icon: '🕒' },
  { value: 60, label: '1時間', icon: '🕓' },
  { value: 180, label: '3時間', icon: '🕘' },
  { value: 1440, label: '24時間', icon: '📅' },
  { value: 10080, label: '1週間', icon: '🗓️' }
];

/**
 * アラートキーを生成
 * @param symbol 銘柄コード
 * @param alertType アラート種別
 * @returns アラートキー
 */
export const generateAlertKey = (symbol: string, alertType: AlertType): string => {
  return `${symbol}-${alertType}`;
};

/**
 * スヌーズ期間の表示用ラベルを取得
 * @param duration スヌーズ期間（分）
 * @returns 表示ラベル
 */
export const getSnoozeDurationLabel = (duration: SnoozeDuration): string => {
  const option = SNOOZE_DURATIONS.find(d => d.value === duration);
  return option ? `${option.icon} ${option.label}` : `${duration}分`;
};

/**
 * スヌーズ終了までの残り時間を計算
 * @param snoozeUntil スヌーズ解除時刻
 * @returns 残り時間の説明文
 */
export const getTimeUntilUnsnooze = (snoozeUntil: number): string => {
  const now = Date.now();
  const diff = snoozeUntil - now;

  if (diff <= 0) return '期限切れ';

  const minutes = Math.ceil(diff / (1000 * 60));

  if (minutes < 60) return `${minutes}分後`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}時間${remainingMinutes}分後` : `${hours}時間後`;
  }

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  return remainingHours > 0 ? `${days}日${remainingHours}時間後` : `${days}日後`;
};
