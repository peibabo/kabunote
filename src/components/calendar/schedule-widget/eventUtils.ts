import { InvestmentEvent } from '@/types/investmentCalendar';

// イベントタイプ別のアイコン
export function getEventIcon(type: InvestmentEvent['type']): string {
  switch (type) {
    case 'earnings': return '📈';
    case 'shareholder-meeting': return '🏛️';
    case 'dividend-rights-last':
    case 'dividend-rights-confirmation': return '💰';
    case 'shareholder-rights-last':
    case 'shareholder-rights-confirmation': return '🎁';
    default: return '📅';
  }
}

// イベントタイプ別のラベル
export function getEventLabel(type: InvestmentEvent['type']): string {
  switch (type) {
    case 'earnings': return '決算発表';
    case 'shareholder-meeting': return '株主総会';
    case 'dividend-rights-last': return '配当権利付き最終日';
    case 'dividend-rights-confirmation': return '配当権利確定日';
    case 'shareholder-rights-last': return '優待権利付き最終日';
    case 'shareholder-rights-confirmation': return '優待権利確定日';
    default: return 'イベント';
  }
}

// 緊急度スタイル
export function getUrgencyStyle(days: number) {
  if (days <= 0) return { border: 'border-red-500/60', bg: 'bg-red-900/30', text: 'text-red-300', glow: '0 0 12px rgba(239, 68, 68, 0.4)', pulse: true };
  if (days <= 3) return { border: 'border-orange-500/60', bg: 'bg-orange-900/30', text: 'text-orange-300', glow: '0 0 10px rgba(249, 115, 22, 0.35)', pulse: true };
  if (days <= 7) return { border: 'border-yellow-500/50', bg: 'bg-yellow-900/20', text: 'text-yellow-300', glow: '0 0 8px rgba(234, 179, 8, 0.25)', pulse: false };
  if (days <= 14) return { border: 'border-blue-500/40', bg: 'bg-blue-900/20', text: 'text-blue-300', glow: '0 0 6px rgba(59, 130, 246, 0.2)', pulse: false };
  return { border: 'border-gray-600/40', bg: 'bg-gray-800/30', text: 'text-gray-400', glow: 'none', pulse: false };
}

// 日数差を計算
export function calculateDaysUntil(dateStr: string): number {
  const eventDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);
  return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
