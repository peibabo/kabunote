// デイリーダイジェスト関連の計算ユーティリティ（純粋関数）

import { StockData } from '@/hooks/useStockData';
import { CalendarDataMap } from '@/hooks/useCalendarData';
import { calculateFullDateFromMonthDay } from '@/lib/investmentCalendarCalc';
import { getAllActiveAlerts, AlertInfo } from '@/utils/alertSystem';
import { calculatePositionSummary } from '@/lib/positionCalc';
import { analyzeNextActionPlan, hasNextActionPlan } from '@/lib/nextActionPlanCalc';
import { NextActionPlan } from '@/types/nextActionPlan';
import { SnoozedAlert } from '@/types/snooze';

// ---- 型定義 ----

export interface DigestEvent {
  symbol: string;
  name: string;
  date: string;
  type: 'earnings' | 'dividend_rights' | 'benefit_rights' | 'shareholder_meeting';
  daysUntil: number;
}

export interface DigestAlert {
  symbol: string;
  name: string;
  type: string;
  message: string;
  isUrgent: boolean;
}

export interface DigestAction {
  symbol: string;
  name: string;
  actionType: 'buy' | 'sell' | 'hold';
  priority: string;
  targetPrice: number | null;
  currentPrice: number;
  isApproaching: boolean;
}

export interface PortfolioHighlight {
  totalInvestment: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossRate: number;
  stocksWithPositions: number;
}

export interface DailyDigestData {
  events: DigestEvent[];
  alerts: DigestAlert[];
  actions: DigestAction[];
  portfolio: PortfolioHighlight | null;
  hasAnyData: boolean;
}

// ---- イベントタイプのラベル ----

const EVENT_TYPE_LABELS: Record<DigestEvent['type'], string> = {
  earnings: '決算',
  dividend_rights: '配当権利',
  benefit_rights: '優待権利',
  shareholder_meeting: '株主総会',
};

export const getEventTypeLabel = (type: DigestEvent['type']): string => {
  return EVENT_TYPE_LABELS[type] || type;
};

// ---- アラートタイプのラベル ----

const ALERT_TYPE_MESSAGES: Record<string, string> = {
  'insufficient-funds': '資金不足',
  'stop-loss-exceeded': '損切りライン超過',
  'nextaction-approaching': '目標価格に接近中',
  'stop-loss': '損切りラインに接近',
  'target-profit': '利確目標に接近',
  'nextaction-warning': '目標価格に注意',
};

const URGENT_ALERT_TYPES = new Set([
  'insufficient-funds',
  'stop-loss-exceeded',
  'nextaction-approaching',
]);

// ---- 関数 ----

/**
 * カレンダーデータから近日のイベントを抽出
 */
export const extractUpcomingEvents = (
  calendarData: CalendarDataMap,
  daysAhead: number = 7,
  today: Date = new Date()
): DigestEvent[] => {
  const events: DigestEvent[] = [];
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const limitTime = todayTime + daysAhead * 24 * 60 * 60 * 1000;

  for (const [symbol, data] of Object.entries(calendarData)) {
    // 決算発表日
    if (data.earningsDate) {
      const earningsDate = new Date(data.earningsDate);
      const earningsTime = earningsDate.getTime();
      if (earningsTime >= todayTime && earningsTime <= limitTime) {
        const daysUntil = Math.round((earningsTime - todayTime) / (24 * 60 * 60 * 1000));
        events.push({
          symbol,
          name: data.name,
          date: data.earningsDate,
          type: 'earnings',
          daysUntil,
        });
      }
    }

    // 配当権利確定日
    const divSettings = data.dividendRightsSettings;
    if (divSettings.isActive && divSettings.month !== null && divSettings.day !== null) {
      const divDate = calculateFullDateFromMonthDay(divSettings.month, divSettings.day, divSettings.isRecurring);
      const divTime = divDate.getTime();
      if (divTime >= todayTime && divTime <= limitTime) {
        const daysUntil = Math.round((divTime - todayTime) / (24 * 60 * 60 * 1000));
        events.push({
          symbol,
          name: data.name,
          date: divDate.toISOString().split('T')[0],
          type: 'dividend_rights',
          daysUntil,
        });
      }
    }

    // 優待権利確定日
    const shSettings = data.shareholderRightsSettings;
    if (shSettings.isActive && shSettings.month !== null && shSettings.day !== null) {
      const shDate = calculateFullDateFromMonthDay(shSettings.month, shSettings.day, shSettings.isRecurring);
      const shTime = shDate.getTime();
      if (shTime >= todayTime && shTime <= limitTime) {
        const daysUntil = Math.round((shTime - todayTime) / (24 * 60 * 60 * 1000));
        events.push({
          symbol,
          name: data.name,
          date: shDate.toISOString().split('T')[0],
          type: 'benefit_rights',
          daysUntil,
        });
      }
    }

    // 株主総会
    const mtgSettings = data.shareholderMeetingSettings;
    if (mtgSettings.isActive && mtgSettings.month !== null && mtgSettings.day !== null) {
      const mtgDate = calculateFullDateFromMonthDay(mtgSettings.month, mtgSettings.day, mtgSettings.isRecurring);
      const mtgTime = mtgDate.getTime();
      if (mtgTime >= todayTime && mtgTime <= limitTime) {
        const daysUntil = Math.round((mtgTime - todayTime) / (24 * 60 * 60 * 1000));
        events.push({
          symbol,
          name: data.name,
          date: mtgDate.toISOString().split('T')[0],
          type: 'shareholder_meeting',
          daysUntil,
        });
      }
    }
  }

  // daysUntilでソート
  events.sort((a, b) => a.daysUntil - b.daysUntil);
  return events;
};

/**
 * 全銘柄のアクティブなアラートを抽出
 */
export const extractActiveAlerts = (
  stockData: StockData[],
  cashAmount: string,
  snoozedAlerts: SnoozedAlert[] = []
): DigestAlert[] => {
  const alerts: DigestAlert[] = [];
  const availableCash = parseFloat(cashAmount) || 0;
  const now = Date.now();

  const isSnoozed = (symbol: string, alertType: string): boolean => {
    const alertKey = `${symbol}-${alertType}`;
    return snoozedAlerts.some(s => s.alertKey === alertKey && s.snoozeUntil > now);
  };

  for (const stock of stockData) {
    const currentPrice = stock.currentPrice ?? 0;
    if (currentPrice <= 0) continue;

    const targetPrice = stock.targetPrice ?? 0;
    const stopLossPrice = stock.stopLossPrice ?? 0;

    const nap = stock.nextActionPlan;
    const plan: NextActionPlan = nap ? {
      id: 'db',
      actionType: nap.actionType as 'buy' | 'sell' | 'hold',
      priority: nap.priority as 'high' | 'medium' | 'low',
      targetPrice: nap.targetPrice ?? 0,
      targetQuantity: nap.targetShares ?? 0,
      memo: nap.strategyMemo,
      updatedAt: '',
    } : { id: '', targetPrice: 0, targetQuantity: 0, memo: '', actionType: 'buy', priority: 'medium', updatedAt: '' };

    const positionSummary = stock.positions.length > 0
      ? calculatePositionSummary(stock.positions)
      : undefined;

    const activeAlerts = getAllActiveAlerts(
      plan,
      currentPrice,
      targetPrice,
      stopLossPrice.toString(),
      positionSummary && positionSummary.totalShares > 0 ? positionSummary : undefined,
      availableCash
    );

    for (const alert of activeAlerts) {
      if (!isSnoozed(stock.symbol, alert.type)) {
        alerts.push({
          symbol: stock.symbol,
          name: stock.name,
          type: alert.type,
          message: ALERT_TYPE_MESSAGES[alert.type] || alert.type,
          isUrgent: URGENT_ALERT_TYPES.has(alert.type),
        });
      }
    }
  }

  return alerts;
};

/**
 * 優先度の高いNext Actionを抽出
 */
export const extractHighPriorityActions = (
  stockData: StockData[],
  cashAmount: string
): DigestAction[] => {
  const actions: DigestAction[] = [];
  const availableCash = parseFloat(cashAmount) || 0;

  for (const stock of stockData) {
    const nap = stock.nextActionPlan;
    if (!nap) continue;

    const plan: NextActionPlan = {
      id: 'db',
      actionType: nap.actionType as 'buy' | 'sell' | 'hold',
      priority: nap.priority as 'high' | 'medium' | 'low',
      targetPrice: nap.targetPrice ?? 0,
      targetQuantity: nap.targetShares ?? 0,
      memo: nap.strategyMemo,
      updatedAt: '',
    };

    if (!hasNextActionPlan(plan)) continue;

    const currentPrice = stock.currentPrice ?? 0;
    const positionSummary = stock.positions.length > 0
      ? calculatePositionSummary(stock.positions)
      : null;

    const analysis = currentPrice > 0
      ? analyzeNextActionPlan(
          plan,
          currentPrice,
          positionSummary && positionSummary.totalShares > 0 ? positionSummary : null,
          availableCash
        )
      : null;

    actions.push({
      symbol: stock.symbol,
      name: stock.name,
      actionType: plan.actionType,
      priority: plan.priority,
      targetPrice: plan.targetPrice,
      currentPrice,
      isApproaching: analysis?.isApproaching || analysis?.isWarning || false,
    });
  }

  // 優先度順にソート: high > medium > low, approaching優先
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  actions.sort((a, b) => {
    if (a.isApproaching !== b.isApproaching) return a.isApproaching ? -1 : 1;
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);
  });

  return actions;
};

/**
 * ポートフォリオのハイライト情報を計算
 */
export const calculatePortfolioHighlight = (
  stockData: StockData[]
): PortfolioHighlight | null => {
  let totalInvestment = 0;
  let totalCurrentValue = 0;
  let stocksWithPositions = 0;

  for (const stock of stockData) {
    if (stock.positions.length === 0) continue;

    const summary = calculatePositionSummary(stock.positions);
    if (summary.totalShares <= 0) continue;

    const currentPrice = stock.currentPrice ?? 0;
    if (currentPrice <= 0) continue;

    stocksWithPositions++;
    totalInvestment += summary.totalCost;
    totalCurrentValue += summary.totalShares * currentPrice;
  }

  if (stocksWithPositions === 0) return null;

  const totalProfitLoss = totalCurrentValue - totalInvestment;
  const totalProfitLossRate = totalInvestment > 0
    ? (totalProfitLoss / totalInvestment) * 100
    : 0;

  return {
    totalInvestment,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossRate,
    stocksWithPositions,
  };
};
