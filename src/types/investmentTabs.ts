/**
 * 投資戦略タブのサブタブ定義
 */

export type InvestmentTabId = 'analysis' | 'nextaction';

export interface InvestmentTab {
  id: InvestmentTabId;
  label: string;
  icon: string;
}

export const INVESTMENT_TABS: InvestmentTab[] = [
  {
    id: 'analysis',
    label: '分析',
    icon: '📊'
  },
  {
    id: 'nextaction',
    label: '次の一手',
    icon: '🎯'
  }
];