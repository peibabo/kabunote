import { describe, it, expect } from 'vitest';
import { getTickSize, stepPriceUp, stepPriceDown } from '@/lib/tickSize';

describe('getTickSize', () => {
  it('TOPIX500以外: 価格帯ごとの呼値を返す', () => {
    expect(getTickSize(500, false)).toBe(1);
    expect(getTickSize(3000, false)).toBe(1);
    expect(getTickSize(3001, false)).toBe(5);
    expect(getTickSize(5000, false)).toBe(5);
    expect(getTickSize(6000, false)).toBe(10);
    expect(getTickSize(30000, false)).toBe(10);
    expect(getTickSize(30001, false)).toBe(50);
    expect(getTickSize(100000, false)).toBe(100);
  });

  it('TOPIX500構成銘柄: 価格帯ごとの呼値を返す', () => {
    expect(getTickSize(500, true)).toBe(0.1);
    expect(getTickSize(1000, true)).toBe(0.1);
    expect(getTickSize(1500, true)).toBe(0.5);
    expect(getTickSize(6000, true)).toBe(1);
    expect(getTickSize(20000, true)).toBe(5);
    expect(getTickSize(50000, true)).toBe(10);
  });
});

describe('stepPriceUp', () => {
  it('呼値1つ分だけ上げる', () => {
    expect(stepPriceUp(1000, false)).toBe(1001);
    expect(stepPriceUp(6000, false)).toBe(6010);
    expect(stepPriceUp(4000, false)).toBe(4005);
  });

  it('バンド境界ちょうどからは上のバンドの呼値で上げる', () => {
    expect(stepPriceUp(3000, false)).toBe(3005);
    expect(stepPriceUp(5000, false)).toBe(5010);
    expect(stepPriceUp(1000, true)).toBe(1000.5);
  });

  it('刻みに乗っていない価格は次の刻みに揃える', () => {
    expect(stepPriceUp(6003, false)).toBe(6010);
    expect(stepPriceUp(3003, false)).toBe(3005);
  });

  it('0.1円刻みで浮動小数点誤差が出ない', () => {
    expect(stepPriceUp(123.4, true)).toBe(123.5);
    expect(stepPriceUp(0.2, true)).toBe(0.3);
  });

  it('0や負数からは最小の呼値になる', () => {
    expect(stepPriceUp(0, false)).toBe(1);
    expect(stepPriceUp(-5, true)).toBe(0.1);
  });
});

describe('stepPriceDown', () => {
  it('呼値1つ分だけ下げる', () => {
    expect(stepPriceDown(1000, false)).toBe(999);
    expect(stepPriceDown(6000, false)).toBe(5990);
    expect(stepPriceDown(4000, false)).toBe(3995);
  });

  it('バンド境界の1つ上からは境界に下がり、境界からは下のバンドの呼値で下げる', () => {
    expect(stepPriceDown(3005, false)).toBe(3000);
    expect(stepPriceDown(3000, false)).toBe(2999);
    expect(stepPriceDown(1000.5, true)).toBe(1000);
    expect(stepPriceDown(1000, true)).toBe(999.9);
  });

  it('刻みに乗っていない価格は前の刻みに揃える', () => {
    expect(stepPriceDown(6003, false)).toBe(6000);
    expect(stepPriceDown(3003, false)).toBe(3000);
  });

  it('0未満にはならない', () => {
    expect(stepPriceDown(1, false)).toBe(0);
    expect(stepPriceDown(0, false)).toBe(0);
    expect(stepPriceDown(-3, false)).toBe(0);
  });
});
