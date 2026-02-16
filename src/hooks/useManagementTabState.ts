import { useLocalStorage } from './useLocalStorage';
import { ManagementTabId, MANAGEMENT_TABS } from '@/types/managementTabs';

/**
 * 管理タブのサブタブ状態管理フック
 * @param symbol - 株式銘柄コード
 * @param defaultTab - デフォルトタブ
 * @returns [activeTab, setActiveTab, tabs, isLoading]
 */
export function useManagementTabState(symbol: string, defaultTab: ManagementTabId = 'events') {
  const tabKey = `kabunote-management-tab-${symbol}`;

  // localStorage管理（100ms デバウンス）
  const [activeTab, setActiveTab, isLoading] = useLocalStorage(
    tabKey,
    defaultTab,
    100,
    // カスタムパーサー：有効なタブIDのみ許可
    (value: string): ManagementTabId => {
      if (value === 'events' || value === 'dividend' || value === 'shareholder') {
        return value;
      }
      return defaultTab; // 不正な値の場合はデフォルトを返す
    },
    // カスタムシリアライザー：そのまま文字列として保存
    (value: ManagementTabId) => value
  );

  return {
    activeTab,
    setActiveTab,
    tabs: MANAGEMENT_TABS,
    isLoading
  } as const;
}