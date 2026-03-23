/**
 * 前回スナップショット株価との比較計算ユーティリティ
 */

export interface PriceChange {
  diff: number;
  changeRate: number;
  direction: 'up' | 'down' | 'unchanged';
}

export function calcPriceChange(
  currentPrice: number | null,
  snapshotPrice: number | null
): PriceChange | null {
  if (currentPrice == null || snapshotPrice == null || snapshotPrice === 0) return null;
  const diff = currentPrice - snapshotPrice;
  const changeRate = diff / snapshotPrice;
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'unchanged';
  return { diff, changeRate, direction };
}

export function formatPriceChange(change: PriceChange): {
  diffText: string;
  rateText: string;
} {
  const sign = change.diff > 0 ? '+' : '';
  const diffText = `${sign}${change.diff.toLocaleString()}`;
  const rateText = `${sign}${(change.changeRate * 100).toFixed(2)}%`;
  return { diffText, rateText };
}
