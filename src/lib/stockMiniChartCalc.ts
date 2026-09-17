// StockMiniChart 用の計算ロジック

import { formatDateLabel } from '@/lib/dateFormat';

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

// 日付文字列を M/D 形式に変換する（実体は dateFormat に集約）
export { formatDateLabel };

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

// 購入・売却マーカー用の型
export interface TradeMarkerEntry {
  date: string; // 取引日（YYYY-MM-DD）
  shares: number; // 株数
  price: number; // 単価（1株あたり）
}

export interface TradeMarkerCell {
  buys: TradeMarkerEntry[];
  sells: TradeMarkerEntry[];
}

/**
 * 取引日を最寄りのスナップショット日にスナップする。
 * - 完全一致があればそれを返す
 * - 無ければ日数差が最小のスナップショット日を返す（範囲外でも最近傍に寄せる）
 * - スナップショットが空なら null
 */
function snapToNearestSnapshot(date: string, snapshotDates: string[]): string | null {
  if (snapshotDates.length === 0) return null;

  const target = Date.parse(date);
  if (Number.isNaN(target)) return null;

  let nearest: string | null = null;
  let minDiff = Infinity;
  for (const snap of snapshotDates) {
    if (snap === date) return snap;
    const diff = Math.abs(Date.parse(snap) - target);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = snap;
    }
  }
  return nearest;
}

/**
 * 購入・売却の取引を、株価ライン上のスナップショット日に対応付けたマップを構築する。
 * 各取引日は最寄りのスナップショット日にスナップして集約する（カテゴリ軸対応）。
 * date が空文字の取引（取得日未設定ロット等）は除外する。
 *
 * @param snapshotDates チャートに描画されるスナップショット日（YYYY-MM-DD）の配列
 * @param buys 購入エントリ
 * @param sells 売却エントリ
 * @returns Map<スナップショット日(YYYY-MM-DD), { buys, sells }>
 */
export function buildTradeMarkerMap(
  snapshotDates: string[],
  buys: TradeMarkerEntry[],
  sells: TradeMarkerEntry[],
): Map<string, TradeMarkerCell> {
  const map = new Map<string, TradeMarkerCell>();

  const assign = (entries: TradeMarkerEntry[], kind: 'buys' | 'sells') => {
    for (const entry of entries) {
      if (!entry.date) continue;
      const snap = snapToNearestSnapshot(entry.date, snapshotDates);
      if (!snap) continue;
      let cell = map.get(snap);
      if (!cell) {
        cell = { buys: [], sells: [] };
        map.set(snap, cell);
      }
      cell[kind].push(entry);
    }
  };

  assign(buys, 'buys');
  assign(sells, 'sells');

  return map;
}
