import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/lib/toast';
import { useAppEvent } from '../util/useAppEvent';
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents';
import { DEFAULT_STOCK_LINK_SETTINGS, type StockLinkSetting } from '@/lib/stockExternalLinks';

interface UseStockLinkSettingsResult {
  settings: StockLinkSetting[];
  isLoading: boolean;
  saveSettings: (settings: StockLinkSetting[]) => Promise<void>;
}

// Module-level cache
let cachedSettings: StockLinkSetting[] | null = null;
let fetchPromise: Promise<StockLinkSetting[] | null> | null = null;

async function fetchSettingsOnce(): Promise<StockLinkSetting[] | null> {
  if (cachedSettings) return cachedSettings;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch('/api/stock-link-settings');
      if (!response.ok) throw new Error('銘柄リンク設定の取得に失敗しました');
      const result = await response.json();
      const settings = result.data ?? DEFAULT_STOCK_LINK_SETTINGS;
      cachedSettings = settings;
      return settings;
    } catch {
      return null;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export function useStockLinkSettings(): UseStockLinkSettingsResult {
  const [settings, setSettings] = useState<StockLinkSetting[]>(cachedSettings ?? DEFAULT_STOCK_LINK_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(cachedSettings === null);

  useEffect(() => {
    if (cachedSettings) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    fetchSettingsOnce().then(data => {
      if (cancelled) return;
      if (data) {
        setSettings(data);
      }
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Listen for updates from other instances
  useAppEvent(APP_EVENTS.STOCK_LINK_SETTINGS_UPDATE, (detail) => setSettings(detail));

  const saveSettings = useCallback(async (newSettings: StockLinkSetting[]) => {
    try {
      const response = await fetch('/api/stock-link-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: newSettings }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || '銘柄リンク設定の保存に失敗しました');
      }
      const result = await response.json();
      const savedSettings = result.data ?? newSettings;

      // Update cache and broadcast
      cachedSettings = savedSettings;
      setSettings(savedSettings);
      emitAppEvent(APP_EVENTS.STOCK_LINK_SETTINGS_UPDATE, savedSettings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '保存に失敗しました';
      toast.error(msg);
      throw err;
    }
  }, []);

  return { settings, isLoading, saveSettings };
}
