// StockMiniChart 用の計算ロジック

export interface PriceHistoryItem {
  price: number | null;
}

/**
 * 株価履歴 + 利確目標 + 損切ラインから YAxis の domain [min, max] を計算する
 */
export function calcYAxisDomain(
  history: PriceHistoryItem[],
  targetPrice?: number,
  stopLossPrice?: number,
): [number, number] {
  const prices: number[] = [];

  for (const item of history) {
    if (item.price != null) prices.push(item.price);
  }

  if (targetPrice && targetPrice > 0) prices.push(targetPrice);
  if (stopLossPrice && stopLossPrice > 0) prices.push(stopLossPrice);

  if (prices.length === 0) return [0, 100];

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const margin = (max - min) * 0.1 || max * 0.05 || 10;

  return [Math.max(0, Math.floor(min - margin)), Math.ceil(max + margin)];
}

/**
 * 日付文字列を M/D 形式に変換する
 */
export function formatDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
}

/**
 * チャートデータを変換する
 */
export function transformChartData(
  history: (PriceHistoryItem & { date: string })[],
): { date: string; fullDate: string; price: number | null }[] {
  return history.map(item => ({
    date: formatDateLabel(item.date),
    fullDate: item.date,
    price: item.price,
  }));
}
