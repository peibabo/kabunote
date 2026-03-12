import { useState, useEffect, useCallback } from 'react';
import { SnoozedAlert, SnoozeDuration, generateAlertKey } from '@/types/snooze';
import { AlertType } from '@/utils/alertSystem';
import { STORAGE_KEYS } from '@/lib/storageKeys';

const STORAGE_KEY = STORAGE_KEYS.SNOOZED_ALERTS;

/** localStorage からスヌーズデータを読み込み（純粋関数） */
function loadSnoozedAlertsFromStorage(): SnoozedAlert[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const alerts = JSON.parse(stored) as SnoozedAlert[];
    // 期限切れのスヌーズを除外
    const validAlerts = alerts.filter(alert => alert.snoozeUntil > Date.now());

    // 期限切れがあった場合は localStorage を更新
    if (validAlerts.length !== alerts.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validAlerts));
      // localStorageChange イベントを発火
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: STORAGE_KEY }
      }));
    }

    return validAlerts;
  } catch (error) {
    console.error('Failed to load snoozed alerts:', error);
    return [];
  }
}

/**
 * スヌーズ機能管理フック
 */
export const useSnooze = () => {
  const [snoozedAlerts, setSnoozedAlerts] = useState<SnoozedAlert[]>(() => loadSnoozedAlertsFromStorage());

  // localStorage からスヌーズデータを読み込み（コールバック用）
  const loadSnoozedAlerts = useCallback(() => loadSnoozedAlertsFromStorage(), []);

  // スヌーズデータをlocalStorageに保存
  const saveSnoozedAlerts = useCallback((alerts: SnoozedAlert[]) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
      // localStorageChange イベントを発火
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key: STORAGE_KEY }
      }));
    } catch (error) {
      console.error('Failed to save snoozed alerts:', error);
    }
  }, []);

  // 定期的な期限切れチェック（1分ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      const currentAlerts = loadSnoozedAlerts();
      setSnoozedAlerts(currentAlerts);
    }, 60000); // 1分ごと

    return () => clearInterval(interval);
  }, [loadSnoozedAlerts]);

  /**
   * アラートをスヌーズ
   */
  const snoozeAlert = useCallback((
    symbol: string,
    alertType: AlertType,
    duration: SnoozeDuration,
    originalAlert: SnoozedAlert['originalAlert'],
    reason?: string
  ) => {
    const alertKey = generateAlertKey(symbol, alertType);
    const now = Date.now();
    const snoozeUntil = now + (duration * 60 * 1000);

    const newSnoozedAlert: SnoozedAlert = {
      alertKey,
      symbol,
      alertType,
      snoozeUntil,
      snoozedAt: now,
      duration,
      originalAlert,
      reason
    };

    // 既存のスヌーズを除外して新しいスヌーズを追加
    const updatedAlerts = snoozedAlerts
      .filter(alert => alert.alertKey !== alertKey)
      .concat(newSnoozedAlert);

    setSnoozedAlerts(updatedAlerts);
    saveSnoozedAlerts(updatedAlerts);

  }, [snoozedAlerts, saveSnoozedAlerts]);

  /**
   * スヌーズを手動解除
   */
  const unsnoozeAlert = useCallback((alertKey: string) => {
    const updatedAlerts = snoozedAlerts.filter(alert => alert.alertKey !== alertKey);
    setSnoozedAlerts(updatedAlerts);
    saveSnoozedAlerts(updatedAlerts);

  }, [snoozedAlerts, saveSnoozedAlerts]);

  /**
   * 特定アラートがスヌーズ中かチェック
   */
  const isAlertSnoozed = useCallback((symbol: string, alertType: AlertType): boolean => {
    const alertKey = generateAlertKey(symbol, alertType);
    return snoozedAlerts.some(alert =>
      alert.alertKey === alertKey && alert.snoozeUntil > Date.now()
    );
  }, [snoozedAlerts]);

  /**
   * スヌーズ中のアラート一覧を取得
   */
  const getSnoozedAlerts = useCallback((): SnoozedAlert[] => {
    const now = Date.now();
    return snoozedAlerts.filter(alert => alert.snoozeUntil > now);
  }, [snoozedAlerts]);

  /**
   * 期限切れスヌーズを手動クリーンアップ
   */
  const cleanupExpiredSnoozes = useCallback(() => {
    const validAlerts = loadSnoozedAlerts();
    setSnoozedAlerts(validAlerts);
  }, [loadSnoozedAlerts]);

  /**
   * 全スヌーズをクリア
   */
  const clearAllSnoozes = useCallback(() => {
    setSnoozedAlerts([]);
    saveSnoozedAlerts([]);
  }, [saveSnoozedAlerts]);

  return {
    snoozedAlerts: getSnoozedAlerts(),
    isLoaded: true,
    snoozeAlert,
    unsnoozeAlert,
    isAlertSnoozed,
    getSnoozedAlerts,
    cleanupExpiredSnoozes,
    clearAllSnoozes
  };
};