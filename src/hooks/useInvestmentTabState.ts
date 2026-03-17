import { useLocalStorage } from './util/useLocalStorage';
import { InvestmentTabId, INVESTMENT_TABS } from '@/types/investmentTabs';

/**
 * 投資戦略タブのサブタブ状態管理フック
 * @param symbol - 株式銘柄コード
 * @param defaultTab - デフォルトタブ
 * @returns [activeTab, setActiveTab, tabs, isLoading]
 */
export function useInvestmentTabState(symbol: string, defaultTab: InvestmentTabId = 'analysis') {
  const tabKey = `kabunote-investment-tab-${symbol}`;

  // localStorage管理（100ms デバウンス）
  const [activeTab, setActiveTab, isLoading] = useLocalStorage(
    tabKey,
    defaultTab,
    100,
    // カスタムパーサー：有効なタブIDのみ許可
    (value: string): InvestmentTabId => {
      if (value === 'analysis' || value === 'nextaction') {
        return value;
      }
      return defaultTab; // 不正な値の場合はデフォルトを返す
    },
    // カスタムシリアライザー：そのまま文字列として保存
    (value: InvestmentTabId) => value
  );

  return {
    activeTab,
    setActiveTab,
    tabs: INVESTMENT_TABS,
    isLoading
  } as const;
}