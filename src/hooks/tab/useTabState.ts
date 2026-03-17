import { useLocalStorage } from '../util/useLocalStorage';

export type TabId = 'basic' | 'analysis' | 'management';

export interface TabDefinition {
  id: TabId;
  label: string;
  icon: string;
}

export const DEFAULT_TABS: TabDefinition[] = [
  { id: 'basic' as const, label: '📝 基本', icon: '📝' },
  { id: 'analysis' as const, label: '🎯 投資戦略', icon: '🎯' },
  { id: 'management' as const, label: '💼 管理', icon: '💼' }
];

/**
 * タブ状態管理フック
 * @param symbol - 株式銘柄コード
 * @param defaultTab - デフォルトタブ
 * @returns [activeTab, setActiveTab, tabs, isLoading]
 */
export function useTabState(symbol: string, defaultTab: TabId = 'basic') {
  const tabKey = `kabunote-active-tab-${symbol}`;

  // localStorage管理（100ms デバウンス）
  const [activeTab, setActiveTab, isLoading] = useLocalStorage(
    tabKey,
    defaultTab,
    100,
    // カスタムパーサー：有効なタブIDのみ許可
    (value: string): TabId => {
      if (value === 'basic' || value === 'analysis' || value === 'management') {
        return value;
      }
      return defaultTab; // 不正な値の場合はデフォルトを返す
    },
    // カスタムシリアライザー：そのまま文字列として保存
    (value: TabId) => value
  );

  return {
    activeTab,
    setActiveTab,
    tabs: DEFAULT_TABS,
    isLoading
  } as const;
}