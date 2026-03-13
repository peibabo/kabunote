// 投資カレンダーの型定義

export interface InvestmentEvent {
  id: string;
  symbol: string;
  companyName: string;
  date: string; // YYYY-MM-DD format
  type: 'earnings' | 'dividend-rights-last' | 'dividend-rights-confirmation' | 'shareholder-rights-last' | 'shareholder-rights-confirmation' | 'shareholder-meeting';
  title: string;
  isRecurring?: boolean;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD format
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: InvestmentEvent[];
}

export interface EventSummary {
  [dateKey: string]: InvestmentEvent[];
}

// タイムライン用の型定義
export interface TimelineEvent {
  date: string; // YYYY-MM-DD format
  dateObj: Date;
  events: InvestmentEvent[];
  daysFromToday: number;
  isToday: boolean;
  isPast: boolean;
}

export interface TimelineEventStyle {
  color: string;
  size: string;
  glow: string;
  priority: number;
  opacity: string;
  animation: string;
}
