'use client';

import { useMemo } from 'react';
import { calculateDaysUntil } from '@/hooks/dividend/useDividendBenefitList';

interface EarningsBadgeProps {
  earningsDate: string;
}

export default function EarningsBadge({ earningsDate }: EarningsBadgeProps) {
  const badgeInfo = useMemo(() => {
    if (!earningsDate) return null;
    const days = calculateDaysUntil(earningsDate);
    if (days < 0 || days > 14) return null;

    if (days === 0) return { label: '決算当日', className: 'bg-red-600 text-red-100 animate-pulse' };
    if (days <= 3) return { label: `決算${days}日後`, className: 'bg-orange-600 text-orange-100 animate-pulse' };
    if (days <= 7) return { label: `決算${days}日後`, className: 'bg-yellow-600 text-yellow-100 animate-pulse' };
    return { label: `決算${days}日後`, className: 'bg-blue-600/80 text-blue-100' };
  }, [earningsDate]);

  if (!badgeInfo) return null;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${badgeInfo.className}`}>
      📈 {badgeInfo.label}
    </span>
  );
}
