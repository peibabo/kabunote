import { describe, it, expect } from 'vitest';
import { calcPriceChange, formatPriceChange } from '@/lib/priceChangeCalc';

describe('calcPriceChange', () => {
  it('上昇時にdirection=upを返す', () => {
    const result = calcPriceChange(1500, 1200);
    expect(result).toEqual({ diff: 300, changeRate: 0.25, direction: 'up' });
  });

  it('下落時にdirection=downを返す', () => {
    const result = calcPriceChange(1000, 1200);
    expect(result).toEqual({
      diff: -200,
      changeRate: expect.closeTo(-0.16667, 4),
      direction: 'down',
    });
  });

  it('変化なしの場合direction=unchangedを返す', () => {
    const result = calcPriceChange(1200, 1200);
    expect(result).toEqual({ diff: 0, changeRate: 0, direction: 'unchanged' });
  });

  it('currentPriceがnullの場合nullを返す', () => {
    expect(calcPriceChange(null, 1200)).toBeNull();
  });

  it('snapshotPriceがnullの場合nullを返す', () => {
    expect(calcPriceChange(1500, null)).toBeNull();
  });

  it('snapshotPriceが0の場合nullを返す（ゼロ除算防止）', () => {
    expect(calcPriceChange(1500, 0)).toBeNull();
  });
});

describe('formatPriceChange', () => {
  it('上昇時にプラス記号付きでフォーマットする', () => {
    const result = formatPriceChange({ diff: 300, changeRate: 0.25, direction: 'up' });
    expect(result.diffText).toBe('+300');
    expect(result.rateText).toBe('+25.00%');
  });

  it('下落時にマイナス記号付きでフォーマットする', () => {
    const result = formatPriceChange({ diff: -200, changeRate: -0.16667, direction: 'down' });
    expect(result.diffText).toBe('-200');
    expect(result.rateText).toBe('-16.67%');
  });

  it('変化なしの場合0と0.00%を返す', () => {
    const result = formatPriceChange({ diff: 0, changeRate: 0, direction: 'unchanged' });
    expect(result.diffText).toBe('0');
    expect(result.rateText).toBe('0.00%');
  });

  it('大きな数値をカンマ区切りでフォーマットする', () => {
    const result = formatPriceChange({ diff: 10500, changeRate: 0.05, direction: 'up' });
    expect(result.diffText).toBe('+10,500');
    expect(result.rateText).toBe('+5.00%');
  });
});
