'use client';

import { StockData } from '@/hooks/useStockData';
import { CalendarDataMap } from '@/hooks/useCalendarData';
import { useDailyDigest } from '@/hooks/useDailyDigest';
import { useAccordionState } from '@/hooks/useAccordionState';
import { formatPrice } from '@/lib/positionCalc';
import { getEventTypeLabel, DigestEvent, DigestAlert, DigestAction, PortfolioHighlight } from '@/lib/dailyDigestCalc';

const MAX_ITEMS = 3;

interface DailyDigestProps {
  stockData: StockData[];
  stockCalendarData: CalendarDataMap;
  cashAmount: string;
  isInitialized: boolean;
  onStockClick: (symbol: string) => void;
  onOpenAlertSummary: () => void;
}

export default function DailyDigest({
  stockData,
  stockCalendarData,
  cashAmount,
  isInitialized,
  onStockClick,
  onOpenAlertSummary,
}: DailyDigestProps) {
  const digest = useDailyDigest(stockData, stockCalendarData, cashAmount, isInitialized);
  const { isExpanded, toggle } = useAccordionState({
    storageKey: 'kabunote-daily-digest-expanded',
    defaultExpanded: true,
  });

  if (!digest.hasAnyData) return null;

  const todayCount = digest.events.filter(e => e.daysUntil === 0).length;
  const urgentCount = digest.alerts.filter(a => a.isUrgent).length;

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      {/* ヘッダー */}
      <button
        onClick={toggle}
        className="cursor-pointer flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <h3 className="text-lg font-semibold text-white">今日のダイジェスト</h3>
          {!isExpanded && (
            <div className="flex items-center gap-2 ml-2">
              {digest.events.length > 0 && (
                <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded-full">
                  📅 {digest.events.length}
                </span>
              )}
              {digest.alerts.length > 0 && (
                <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full">
                  🚨 {digest.alerts.length}
                </span>
              )}
              {digest.actions.length > 0 && (
                <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">
                  🎯 {digest.actions.length}
                </span>
              )}
            </div>
          )}
        </div>
        <span className="text-gray-400 text-sm transition-transform duration-200" style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          ▼
        </span>
      </button>

      {/* コンテンツ */}
      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* 近日イベント */}
          {digest.events.length > 0 && (
            <EventSection events={digest.events} todayCount={todayCount} onStockClick={onStockClick} />
          )}

          {/* アラート */}
          {digest.alerts.length > 0 && (
            <AlertSection alerts={digest.alerts} urgentCount={urgentCount} onOpenAlertSummary={onOpenAlertSummary} />
          )}

          {/* Next Action */}
          {digest.actions.length > 0 && (
            <ActionSection actions={digest.actions} onStockClick={onStockClick} />
          )}

          {/* ポートフォリオ */}
          {digest.portfolio && (
            <PortfolioSection portfolio={digest.portfolio} />
          )}
        </div>
      )}
    </div>
  );
}

// ---- サブセクション ----

function EventSection({
  events,
  todayCount,
  onStockClick,
}: {
  events: DigestEvent[];
  todayCount: number;
  onStockClick: (symbol: string) => void;
}) {
  const displayEvents = events.slice(0, MAX_ITEMS);
  const weekCount = events.length;

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span>📅</span>
          <span className="text-sm font-medium text-white">近日イベント</span>
        </div>
        <div className="text-xs text-gray-400">
          {todayCount > 0 && <span className="text-yellow-400">今日: {todayCount}件 / </span>}
          7日以内: {weekCount}件
        </div>
      </div>
      <div className="space-y-1.5">
        {displayEvents.map((event, i) => (
          <button
            key={`${event.symbol}-${event.type}-${i}`}
            onClick={() => onStockClick(event.symbol)}
            className="cursor-pointer w-full text-left flex items-center gap-2 text-xs hover:bg-gray-600/50 rounded px-1.5 py-1 transition-colors"
          >
            <span className={`font-medium ${event.daysUntil === 0 ? 'text-yellow-400' : 'text-gray-300'}`}>
              {event.daysUntil === 0 ? '今日' : `${event.daysUntil}日後`}
            </span>
            <span className="text-blue-400">{getEventTypeLabel(event.type)}</span>
            <span className="text-gray-300 truncate">{event.name}({event.symbol})</span>
          </button>
        ))}
      </div>
      {events.length > MAX_ITEMS && (
        <div className="mt-2 text-right">
          <span className="text-xs text-blue-400">他{events.length - MAX_ITEMS}件</span>
        </div>
      )}
    </div>
  );
}

function AlertSection({
  alerts,
  urgentCount,
  onOpenAlertSummary,
}: {
  alerts: DigestAlert[];
  urgentCount: number;
  onOpenAlertSummary: () => void;
}) {
  const displayAlerts = alerts.slice(0, MAX_ITEMS);

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span>🚨</span>
          <span className="text-sm font-medium text-white">アラート</span>
        </div>
        <div className="text-xs text-gray-400">
          {urgentCount > 0 && <span className="text-red-400">緊急: {urgentCount}件 / </span>}
          合計: {alerts.length}件
        </div>
      </div>
      <div className="space-y-1.5">
        {displayAlerts.map((alert, i) => (
          <div key={`${alert.symbol}-${alert.type}-${i}`} className="flex items-center gap-2 text-xs px-1.5 py-1">
            <span className={alert.isUrgent ? 'text-red-400' : 'text-yellow-400'}>
              {alert.isUrgent ? '🔴' : '🟡'}
            </span>
            <span className="text-gray-300">{alert.message}</span>
            <span className="text-gray-400 truncate">({alert.symbol})</span>
          </div>
        ))}
      </div>
      <div className="mt-2 text-right">
        <button
          onClick={onOpenAlertSummary}
          className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          全て見る →
        </button>
      </div>
    </div>
  );
}

function ActionSection({
  actions,
  onStockClick,
}: {
  actions: DigestAction[];
  onStockClick: (symbol: string) => void;
}) {
  const displayActions = actions.slice(0, MAX_ITEMS);
  const highPriorityCount = actions.filter(a => a.priority === 'high').length;

  const actionTypeLabel: Record<string, string> = {
    buy: '買い',
    sell: '売り',
    hold: '様子見',
  };

  const actionTypeColor: Record<string, string> = {
    buy: 'text-green-400',
    sell: 'text-red-400',
    hold: 'text-yellow-400',
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span>🎯</span>
          <span className="text-sm font-medium text-white">Next Action</span>
        </div>
        <div className="text-xs text-gray-400">
          {highPriorityCount > 0 && <span className="text-orange-400">優先高: {highPriorityCount}件 / </span>}
          合計: {actions.length}件
        </div>
      </div>
      <div className="space-y-1.5">
        {displayActions.map((action, i) => (
          <button
            key={`${action.symbol}-${i}`}
            onClick={() => onStockClick(action.symbol)}
            className="cursor-pointer w-full text-left flex items-center gap-2 text-xs hover:bg-gray-600/50 rounded px-1.5 py-1 transition-colors"
          >
            <span className={`font-medium ${actionTypeColor[action.actionType] || 'text-gray-300'}`}>
              {actionTypeLabel[action.actionType] || action.actionType}
            </span>
            <span className="text-gray-300 truncate">{action.name}({action.symbol})</span>
            {action.isApproaching && (
              <span className="text-yellow-400 text-[10px] bg-yellow-900/30 px-1 rounded">接近中</span>
            )}
          </button>
        ))}
      </div>
      {actions.length > MAX_ITEMS && (
        <div className="mt-2 text-right">
          <span className="text-xs text-blue-400">他{actions.length - MAX_ITEMS}件</span>
        </div>
      )}
    </div>
  );
}

function PortfolioSection({ portfolio }: { portfolio: PortfolioHighlight }) {
  const isProfit = portfolio.totalProfitLoss >= 0;

  return (
    <div className="bg-gray-700/50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span>💼</span>
        <span className="text-sm font-medium text-white">ポートフォリオ</span>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">総投資額</span>
          <span className="text-gray-200">{formatPrice(portfolio.totalInvestment)}円</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">評価額</span>
          <span className="text-gray-200">{formatPrice(portfolio.totalCurrentValue)}円</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">損益</span>
          <span className={isProfit ? 'text-green-400' : 'text-red-400'}>
            {isProfit ? '+' : ''}{formatPrice(portfolio.totalProfitLoss)}円
            ({isProfit ? '+' : ''}{portfolio.totalProfitLossRate.toFixed(1)}%)
          </span>
        </div>
        <div className="flex justify-between text-xs pt-1 border-t border-gray-600/50">
          <span className="text-gray-400">保有銘柄数</span>
          <span className="text-gray-200">{portfolio.stocksWithPositions}銘柄</span>
        </div>
      </div>
    </div>
  );
}
