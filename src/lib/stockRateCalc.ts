/**
 * 値上がり率チャート用の計算ユーティリティ
 * 表示期間の起点価格を基準にした騰落率（%）を扱う
 */

import type { PortfolioSnapshotData } from '@/types/portfolio';

/**
 * 銘柄ごとの基準価格マップを作る。
 * snapshotDate 昇順のスナップショット配列から、各銘柄の最初の有効価格（非null・0より大）を採用する。
 * 有効価格が一度も現れない銘柄はキー自体を持たない。
 */
export function calcBaselineMap(snapshots: PortfolioSnapshotData[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const snap of snapshots) {
    for (const ss of snap.stockSnapshots) {
      if (!map.has(ss.symbol) && ss.currentPrice != null && ss.currentPrice > 0) {
        map.set(ss.symbol, ss.currentPrice);
      }
    }
  }
  return map;
}

/** 基準価格に対する騰落率（%）。価格・基準が無効なら null */
export function calcRatePercent(
  price: number | null,
  base: number | undefined
): number | null {
  if (price == null || base == null || base <= 0) return null;
  return (price / base - 1) * 100;
}

/** 騰落率を "+5.2%" / "-3.1%" / "0.0%" 形式にフォーマット（小数1桁） */
export function formatRatePercent(rate: number): string {
  const sign = rate > 0 ? '+' : '';
  return `${sign}${rate.toFixed(1)}%`;
}

/** 凡例・ツールチップ用の銘柄ラベル。"7203 トヨタ自動車"、名前がなければ "7203" */
export function formatStockLabel(symbol: string, name?: string | null): string {
  return name ? `${symbol} ${name}` : symbol;
}

/** 凡例用に銘柄名を切り詰める。maxLen 超過時は "トヨタ自動…" 形式 */
export function truncateStockName(name: string, maxLen: number): string {
  return name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
}
