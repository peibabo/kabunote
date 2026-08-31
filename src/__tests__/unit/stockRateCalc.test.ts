import { describe, it, expect } from 'vitest';
import {
  calcBaselineMap,
  calcRatePercent,
  formatRatePercent,
  formatStockLabel,
  truncateStockName,
} from '@/lib/stockRateCalc';
import type { PortfolioSnapshotData, StockSnapshotData } from '@/types/portfolio';

function makeSnapshot(
  snapshotDate: string,
  stocks: { symbol: string; currentPrice: number | null }[]
): PortfolioSnapshotData {
  const stockSnapshots: StockSnapshotData[] = stocks.map((s, i) => ({
    stockId: `stock-${s.symbol}-${i}`,
    symbol: s.symbol,
    currentPrice: s.currentPrice,
    shares: 100,
    value: (s.currentPrice ?? 0) * 100,
    cost: 100000,
  }));
  return {
    id: `snap-${snapshotDate}`,
    snapshotDate,
    totalInvestment: 100000,
    totalValue: 110000,
    profitLoss: 10000,
    cashAmount: 0,
    netAssets: 110000,
    stockSnapshots,
  };
}

describe('calcBaselineMap', () => {
  it('各銘柄の最初の有効価格を基準に採用する', () => {
    const map = calcBaselineMap([
      makeSnapshot('2026-08-01', [{ symbol: '7203', currentPrice: 3000 }, { symbol: '9984', currentPrice: 8000 }]),
      makeSnapshot('2026-08-02', [{ symbol: '7203', currentPrice: 3100 }, { symbol: '9984', currentPrice: 7900 }]),
    ]);
    expect(map.get('7203')).toBe(3000);
    expect(map.get('9984')).toBe(8000);
  });

  it('先頭がnullの場合は次の有効価格を採用する', () => {
    const map = calcBaselineMap([
      makeSnapshot('2026-08-01', [{ symbol: '7203', currentPrice: null }]),
      makeSnapshot('2026-08-02', [{ symbol: '7203', currentPrice: 3100 }]),
    ]);
    expect(map.get('7203')).toBe(3100);
  });

  it('0円は基準として採用しない', () => {
    const map = calcBaselineMap([
      makeSnapshot('2026-08-01', [{ symbol: '7203', currentPrice: 0 }]),
      makeSnapshot('2026-08-02', [{ symbol: '7203', currentPrice: 3100 }]),
    ]);
    expect(map.get('7203')).toBe(3100);
  });

  it('有効価格が一度もない銘柄はキーを持たない', () => {
    const map = calcBaselineMap([
      makeSnapshot('2026-08-01', [{ symbol: '7203', currentPrice: null }]),
      makeSnapshot('2026-08-02', [{ symbol: '7203', currentPrice: null }]),
    ]);
    expect(map.has('7203')).toBe(false);
  });

  it('期間途中から登場した銘柄は登場時の価格が基準になる', () => {
    const map = calcBaselineMap([
      makeSnapshot('2026-08-01', [{ symbol: '7203', currentPrice: 3000 }]),
      makeSnapshot('2026-08-02', [{ symbol: '7203', currentPrice: 3100 }, { symbol: '6758', currentPrice: 2500 }]),
    ]);
    expect(map.get('6758')).toBe(2500);
  });

  it('空配列では空のMapを返す', () => {
    expect(calcBaselineMap([]).size).toBe(0);
  });
});

describe('calcRatePercent', () => {
  it('上昇率を%で返す', () => {
    expect(calcRatePercent(110, 100)).toBeCloseTo(10, 5);
  });

  it('下落率を負の%で返す', () => {
    expect(calcRatePercent(90, 100)).toBeCloseTo(-10, 5);
  });

  it('変化なしは0を返す', () => {
    expect(calcRatePercent(100, 100)).toBe(0);
  });

  it('priceがnullの場合nullを返す', () => {
    expect(calcRatePercent(null, 100)).toBeNull();
  });

  it('baseがundefinedの場合nullを返す', () => {
    expect(calcRatePercent(110, undefined)).toBeNull();
  });

  it('baseが0以下の場合nullを返す（ゼロ除算防止）', () => {
    expect(calcRatePercent(110, 0)).toBeNull();
    expect(calcRatePercent(110, -1)).toBeNull();
  });
});

describe('formatRatePercent', () => {
  it('正の値にプラス記号を付ける', () => {
    expect(formatRatePercent(5.25)).toBe('+5.3%');
  });

  it('負の値はマイナス記号のまま', () => {
    expect(formatRatePercent(-3.14)).toBe('-3.1%');
  });

  it('0は符号なし', () => {
    expect(formatRatePercent(0)).toBe('0.0%');
  });
});

describe('formatStockLabel', () => {
  it('名前ありは「コード 名前」形式', () => {
    expect(formatStockLabel('7203', 'トヨタ自動車')).toBe('7203 トヨタ自動車');
  });

  it('名前がnull/undefined/空文字ならコードのみ', () => {
    expect(formatStockLabel('7203', null)).toBe('7203');
    expect(formatStockLabel('7203', undefined)).toBe('7203');
    expect(formatStockLabel('7203', '')).toBe('7203');
  });
});

describe('truncateStockName', () => {
  it('maxLen以内はそのまま返す', () => {
    expect(truncateStockName('トヨタ自動車', 6)).toBe('トヨタ自動車');
  });

  it('maxLen超過は切り詰めて…を付ける', () => {
    expect(truncateStockName('ソフトバンクグループ', 6)).toBe('ソフトバンク…');
  });

  it('空文字はそのまま', () => {
    expect(truncateStockName('', 6)).toBe('');
  });
});
