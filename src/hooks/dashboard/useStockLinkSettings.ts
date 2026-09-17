import { createCachedSettingsHook } from '@/hooks/util/createCachedSettingsHook';
import { APP_EVENTS } from '@/lib/appEvents';
import { DEFAULT_STOCK_LINK_SETTINGS, type StockLinkSetting } from '@/lib/stockExternalLinks';

interface UseStockLinkSettingsResult {
  settings: StockLinkSetting[];
  isLoading: boolean;
  saveSettings: (settings: StockLinkSetting[]) => Promise<void>;
}

const useCachedStockLinkSettings = createCachedSettingsHook({
  endpoint: '/api/stock-link-settings',
  bodyKey: 'settings',
  eventName: APP_EVENTS.STOCK_LINK_SETTINGS_UPDATE,
  defaultValue: DEFAULT_STOCK_LINK_SETTINGS,
  saveErrorMessage: '銘柄リンク設定の保存に失敗しました',
});

/** 銘柄カードから開く外部リンクの設定（全インスタンスでキャッシュ共有） */
export function useStockLinkSettings(): UseStockLinkSettingsResult {
  const { value, isLoading, save } = useCachedStockLinkSettings();
  return { settings: value, isLoading, saveSettings: save };
}
