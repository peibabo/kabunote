'use client';

import { useState } from 'react';
import { InvestmentEvent } from '@/types/investmentCalendar';
import { FullScreenModal } from '@/components/layout/DashboardModals';
import { getEventIcon, getEventLabel, getUrgencyStyle } from './eventUtils';
import { formatMonthDay } from '@/lib/dateFormat';
import type { UpcomingEvent } from './useEventMap';

// イベントカードの共通レンダリング
function EventCard({ event, daysUntil, onStockClick }: { event: InvestmentEvent; daysUntil: number; onStockClick: (symbol: string) => void }) {
  const style = getUrgencyStyle(daysUntil);
  const icon = getEventIcon(event.type);

  return (
    <button
      key={event.id}
      onClick={() => onStockClick(event.symbol)}
      className={`cursor-pointer w-full text-left p-2.5 rounded-lg border ${style.border} ${style.bg} transition-all duration-200 hover:scale-[1.01] ${style.pulse ? 'animate-pulse' : ''}`}
      style={{ boxShadow: style.glow }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">{icon}</span>
          <span className={`text-sm font-bold ${style.text} shrink-0`}>
            {daysUntil === 0 ? '本日' : daysUntil === 1 ? '明日' : `${daysUntil}日後`}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{getEventLabel(event.type)}</span>
          <span className="text-xs text-gray-300 truncate font-medium">{event.companyName}({event.symbol})</span>
        </div>
        <span className="text-xs text-gray-500 shrink-0 ml-2">{formatMonthDay(event.date)}</span>
      </div>
    </button>
  );
}

const MAX_VISIBLE_EVENTS = 5;

export default function UpcomingEventsContent({ events, onStockClick }: { events: UpcomingEvent[]; onStockClick: (symbol: string) => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (events.length === 0) {
    return <div className="text-sm text-gray-500 text-center py-4">7日以内に予定されているイベントはありません</div>;
  }

  const visibleEvents = events.slice(0, MAX_VISIBLE_EVENTS);
  const hasMore = events.length > MAX_VISIBLE_EVENTS;

  return (
    <>
      <div className="space-y-1.5">
        {visibleEvents.map(({ event, daysUntil }) => (
          <EventCard key={event.id} event={event} daysUntil={daysUntil} onStockClick={onStockClick} />
        ))}
        {hasMore && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer w-full text-center py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            すべて表示（{events.length}件）
          </button>
        )}
      </div>
      <FullScreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="🔔 直近のイベント"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-1.5">
          {events.map(({ event, daysUntil }) => (
            <EventCard key={event.id} event={event} daysUntil={daysUntil} onStockClick={onStockClick} />
          ))}
        </div>
      </FullScreenModal>
    </>
  );
}
