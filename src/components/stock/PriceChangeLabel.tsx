'use client';

import { calcPriceChange, formatPriceChange } from '@/lib/priceChangeCalc';

interface PriceChangeLabelProps {
  currentPrice: string;
  snapshotPrice: number | null;
  snapshotDate: string | null;
  size?: 'sm' | 'xs';
}

export default function PriceChangeLabel({
  currentPrice,
  snapshotPrice,
  snapshotDate,
  size = 'sm',
}: PriceChangeLabelProps) {
  const current = parseFloat(currentPrice);
  if (!current || current <= 0) return null;

  const change = calcPriceChange(current, snapshotPrice);
  if (!change) return null;

  const { diffText, rateText } = formatPriceChange(change);
  const colorClass =
    change.direction === 'up'
      ? 'text-green-400'
      : change.direction === 'down'
        ? 'text-red-400'
        : 'text-gray-400';

  const sizeClass = size === 'xs' ? 'text-xs' : 'text-xs';
  const tooltip = snapshotDate ? `前回記録: ${snapshotDate}` : undefined;

  return (
    <span className={`${sizeClass} ${colorClass}`} title={tooltip}>
      {diffText} ({rateText})
    </span>
  );
}
