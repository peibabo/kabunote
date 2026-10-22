/**
 * 呼値（値動きの最小単位）計算ユーティリティ
 *
 * JPX の呼値の単位に準拠。TOPIX500 構成銘柄とそれ以外で刻みが異なる。
 * 各バンドは「上限以下」の価格に適用される（例: 3,000円ちょうどは 3,000円以下のバンド）。
 */

interface TickBand {
  /** この価格以下に適用（最後のバンドは Infinity） */
  upTo: number;
  tick: number;
}

const STANDARD_BANDS: TickBand[] = [
  { upTo: 3_000, tick: 1 },
  { upTo: 5_000, tick: 5 },
  { upTo: 30_000, tick: 10 },
  { upTo: 50_000, tick: 50 },
  { upTo: 300_000, tick: 100 },
  { upTo: 500_000, tick: 500 },
  { upTo: 3_000_000, tick: 1_000 },
  { upTo: 5_000_000, tick: 5_000 },
  { upTo: 30_000_000, tick: 10_000 },
  { upTo: 50_000_000, tick: 50_000 },
  { upTo: Infinity, tick: 100_000 },
];

const TOPIX500_BANDS: TickBand[] = [
  { upTo: 1_000, tick: 0.1 },
  { upTo: 3_000, tick: 0.5 },
  { upTo: 10_000, tick: 1 },
  { upTo: 30_000, tick: 5 },
  { upTo: 100_000, tick: 10 },
  { upTo: 300_000, tick: 50 },
  { upTo: 1_000_000, tick: 100 },
  { upTo: 3_000_000, tick: 500 },
  { upTo: 10_000_000, tick: 1_000 },
  { upTo: 30_000_000, tick: 5_000 },
  { upTo: Infinity, tick: 10_000 },
];

// 0.1円刻みを整数で扱うためのスケール（浮動小数点誤差回避）
const SCALE = 10;

const bandsFor = (isTopix500: boolean) => (isTopix500 ? TOPIX500_BANDS : STANDARD_BANDS);

/** 指定価格に適用される呼値 */
export function getTickSize(price: number, isTopix500: boolean): number {
  return bandsFor(isTopix500).find((b) => price <= b.upTo)!.tick;
}

/** 指定価格より上の価格帯に適用される呼値（バンド境界ちょうどは上のバンド） */
function getTickSizeAbove(price: number, isTopix500: boolean): number {
  return bandsFor(isTopix500).find((b) => price < b.upTo)!.tick;
}

/** 1呼値上の価格。呼値の刻みに乗っていない価格は次の刻みに揃える */
export function stepPriceUp(price: number, isTopix500: boolean): number {
  const p = Math.round(Math.max(0, price) * SCALE);
  const t = Math.round(getTickSizeAbove(Math.max(0, price), isTopix500) * SCALE);
  return ((Math.floor(p / t) + 1) * t) / SCALE;
}

/** 1呼値下の価格（0未満にはならない）。呼値の刻みに乗っていない価格は前の刻みに揃える */
export function stepPriceDown(price: number, isTopix500: boolean): number {
  if (price <= 0) return 0;
  const p = Math.round(price * SCALE);
  const t = Math.round(getTickSize(price, isTopix500) * SCALE);
  return Math.max(0, ((Math.ceil(p / t) - 1) * t) / SCALE);
}
