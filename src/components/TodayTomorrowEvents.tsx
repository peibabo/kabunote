'use client';

import { InvestmentEvent } from '@/types/investmentCalendar';

interface TodayTomorrowEventsProps {
  events: Record<string, InvestmentEvent[]>;
  onStockClick?: (symbol: string) => void;
}

// イベントタイプ別のアイコンとラベル
const getEventIcon = (eventType: InvestmentEvent['type']) => {
  switch (eventType) {
    case 'earnings':
      return '📈';
    case 'shareholder-meeting':
      return '🏛️';
    case 'dividend-rights-last':
    case 'dividend-rights-confirmation':
      return '💰';
    case 'shareholder-rights-last':
    case 'shareholder-rights-confirmation':
      return '🎁';
    default:
      return '📅';
  }
};

const getEventLabel = (eventType: InvestmentEvent['type']) => {
  switch (eventType) {
    case 'earnings':
      return '決算発表';
    case 'shareholder-meeting':
      return '株主総会';
    case 'dividend-rights-last':
      return '配当権利落ち日';
    case 'dividend-rights-confirmation':
      return '配当権利確定日';
    case 'shareholder-rights-last':
      return '優待権利落ち日';
    case 'shareholder-rights-confirmation':
      return '優待権利確定日';
    default:
      return 'イベント';
  }
};

// 今日の日付を YYYY-MM-DD 形式で取得
const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// 明日の日付を YYYY-MM-DD 形式で取得
const getTomorrowString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

export default function TodayTomorrowEvents({ events, onStockClick }: TodayTomorrowEventsProps) {
  const todayString = getTodayString();
  const tomorrowString = getTomorrowString();

  const todayEvents = events[todayString] || [];
  const tomorrowEvents = events[tomorrowString] || [];

  // イベントがない場合は何も表示しない
  if (todayEvents.length === 0 && tomorrowEvents.length === 0) {
    return null;
  }

  const handleStockClick = (symbol: string) => {
    if (onStockClick) {
      onStockClick(symbol);
    }
  };

  return (
    <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <span>🔔</span>
        <span>今日・明日の予定</span>
      </h3>

      <div className="space-y-3">
        {/* 今日のイベント */}
        {todayEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-blue-400 mb-2">📅 本日</h4>
            <div className="space-y-2">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                >
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <button
                      onClick={() => handleStockClick(event.symbol)}
                      className="text-white hover:text-blue-400 font-medium transition-colors cursor-pointer"
                    >
                      {event.companyName}({event.symbol})
                    </button>
                    <span className="text-gray-300 ml-2">{getEventLabel(event.type)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 明日のイベント */}
        {tomorrowEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-400 mb-2">📅 明日</h4>
            <div className="space-y-2">
              {tomorrowEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                >
                  <span className="text-lg">{getEventIcon(event.type)}</span>
                  <div className="flex-1">
                    <button
                      onClick={() => handleStockClick(event.symbol)}
                      className="text-white hover:text-blue-400 font-medium transition-colors cursor-pointer"
                    >
                      {event.companyName}({event.symbol})
                    </button>
                    <span className="text-gray-300 ml-2">{getEventLabel(event.type)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}