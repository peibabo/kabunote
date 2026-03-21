import { NextActionPlan, NextActionPlanAnalysis } from '@/types/nextActionPlan';
import { AlertType } from '@/utils/alertSystem';

export interface StrategyRowData {
  symbol: string;
  companyName: string;
  plan: NextActionPlan;
  alertType: AlertType;
  currentPrice: number;
  analysis?: NextActionPlanAnalysis;
}

export type SortKey = 'priority' | 'action' | 'alert' | 'symbol';

export interface AlertDisplay {
  icon: string;
  text: string;
  color: string;
}

export const getAlertDisplay = (alertType: AlertType): AlertDisplay => {
  switch (alertType) {
    case 'insufficient-funds': return { icon: '\u{1F4B8}', text: '\u8CC7\u91D1\u4E0D\u8DB3', color: 'text-red-400' };
    case 'stop-loss-exceeded': return { icon: '\u{1F4A5}', text: '\u640D\u5207\u308A\u8D85\u904E', color: 'text-red-400' };
    case 'nextaction-approaching': return { icon: '\u{1F6A8}', text: '\u76EE\u6A19\u63A5\u8FD1', color: 'text-red-400' };
    case 'stop-loss': return { icon: '\u{1F53B}', text: '\u640D\u5207\u308A\u63A5\u8FD1', color: 'text-red-400' };
    case 'target-profit': return { icon: '\u{1F4B0}', text: '\u5229\u78BA\u63A5\u8FD1', color: 'text-green-400' };
    case 'nextaction-warning': return { icon: '\u26A0\uFE0F', text: '\u6CE8\u610F', color: 'text-yellow-400' };
    default: return { icon: '\u2705', text: 'OK', color: 'text-gray-400' };
  }
};
