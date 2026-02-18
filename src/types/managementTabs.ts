/**
 * 管理タブ内のサブタブ定義
 */

export type ManagementTabId = 'positions' | 'events' | 'dividend' | 'shareholder';

export interface ManagementTabDefinition {
  id: ManagementTabId;
  label: string;
  icon: string;
}

export const MANAGEMENT_TABS: ManagementTabDefinition[] = [
  { id: 'positions' as const, label: '保有状況', icon: '📈' },
  { id: 'events' as const, label: 'イベント', icon: '📅' },
  { id: 'dividend' as const, label: '配当', icon: '💰' },
  { id: 'shareholder' as const, label: '優待', icon: '🎁' }
];

/**
 * 管理タブのサブタブ状態管理
 */
export interface ManagementTabState {
  activeTab: ManagementTabId;
  setActiveTab: (tab: ManagementTabId) => void;
  tabs: ManagementTabDefinition[];
  isLoading: boolean;
}