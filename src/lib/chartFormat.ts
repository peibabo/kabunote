// チャート（Recharts）の軸ラベル向けフォーマット

/**
 * 数値を Y 軸ラベル用に短縮表記する（1000万 → 「1.0千万」、1万 → 「1万」）
 *
 * ポートフォリオ推移グラフ（評価額・純資産）と銘柄ミニチャート（株価）の
 * 双方で使う。株価は千万の桁に達しないため、銘柄ミニチャートでは
 * 「千万」分岐に入らず従来どおり「万」または生の数値で表示される。
 */
export function formatYAxisValue(value: number): string {
  if (Math.abs(value) >= 10000000) return `${(value / 10000000).toFixed(1)}千万`;
  if (Math.abs(value) >= 10000) return `${Math.round(value / 10000)}万`;
  return String(Math.round(value));
}
