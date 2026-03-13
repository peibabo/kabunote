import { describe, it, expect } from 'vitest';
import {
  isValidOptionalNumber,
  isValidRequiredPositiveNumber,
  isValidPrice,
  isValidRequiredPrice,
  isValidRequiredShares,
  isValidOptionalShares,
  isValidMonth,
  isValidDay,
  isValidFrequency,
  isValidCashAmount,
} from '@/lib/validation';

describe('isValidOptionalNumber', () => {
  it('null/undefinedは許可', () => {
    expect(isValidOptionalNumber(null, 0, 100)).toBe(true);
    expect(isValidOptionalNumber(undefined, 0, 100)).toBe(true);
  });

  it('範囲内の数値は許可', () => {
    expect(isValidOptionalNumber(50, 0, 100)).toBe(true);
    expect(isValidOptionalNumber(0, 0, 100)).toBe(true);
    expect(isValidOptionalNumber(100, 0, 100)).toBe(true);
  });

  it('範囲外の数値は拒否', () => {
    expect(isValidOptionalNumber(-1, 0, 100)).toBe(false);
    expect(isValidOptionalNumber(101, 0, 100)).toBe(false);
  });

  it('Infinity/NaNは拒否', () => {
    expect(isValidOptionalNumber(Infinity, 0, 100)).toBe(false);
    expect(isValidOptionalNumber(-Infinity, 0, 100)).toBe(false);
    expect(isValidOptionalNumber(NaN, 0, 100)).toBe(false);
  });

  it('数値以外は拒否', () => {
    expect(isValidOptionalNumber('50', 0, 100)).toBe(false);
    expect(isValidOptionalNumber(true, 0, 100)).toBe(false);
  });
});

describe('isValidRequiredPositiveNumber', () => {
  it('正の数値は許可', () => {
    expect(isValidRequiredPositiveNumber(1, 100)).toBe(true);
    expect(isValidRequiredPositiveNumber(100, 100)).toBe(true);
  });

  it('0は拒否', () => {
    expect(isValidRequiredPositiveNumber(0, 100)).toBe(false);
  });

  it('上限超過は拒否', () => {
    expect(isValidRequiredPositiveNumber(101, 100)).toBe(false);
  });

  it('Infinity/NaN/null/undefinedは拒否', () => {
    expect(isValidRequiredPositiveNumber(Infinity, 100)).toBe(false);
    expect(isValidRequiredPositiveNumber(NaN, 100)).toBe(false);
    expect(isValidRequiredPositiveNumber(null, 100)).toBe(false);
    expect(isValidRequiredPositiveNumber(undefined, 100)).toBe(false);
  });
});

describe('isValidPrice', () => {
  it('有効な株価は許可', () => {
    expect(isValidPrice(2500)).toBe(true);
    expect(isValidPrice(0)).toBe(true);
    expect(isValidPrice(null)).toBe(true);
    expect(isValidPrice(99_999_999)).toBe(true);
  });

  it('無効な値は拒否', () => {
    expect(isValidPrice(100_000_000)).toBe(false);
    expect(isValidPrice(Infinity)).toBe(false);
    expect(isValidPrice(-1)).toBe(false);
  });
});

describe('isValidRequiredPrice', () => {
  it('正の株価は許可', () => {
    expect(isValidRequiredPrice(100)).toBe(true);
  });

  it('0やnullは拒否', () => {
    expect(isValidRequiredPrice(0)).toBe(false);
    expect(isValidRequiredPrice(null)).toBe(false);
  });
});

describe('isValidRequiredShares / isValidOptionalShares', () => {
  it('有効な株数は許可', () => {
    expect(isValidRequiredShares(100)).toBe(true);
    expect(isValidOptionalShares(null)).toBe(true);
    expect(isValidOptionalShares(0)).toBe(true);
  });

  it('無効な値は拒否', () => {
    expect(isValidRequiredShares(0)).toBe(false);
    expect(isValidRequiredShares(Infinity)).toBe(false);
    expect(isValidOptionalShares(100_000_000)).toBe(false);
  });
});

describe('isValidMonth', () => {
  it('1〜12は許可', () => {
    expect(isValidMonth(1)).toBe(true);
    expect(isValidMonth(12)).toBe(true);
    expect(isValidMonth(null)).toBe(true);
  });

  it('範囲外は拒否', () => {
    expect(isValidMonth(0)).toBe(false);
    expect(isValidMonth(13)).toBe(false);
  });
});

describe('isValidDay', () => {
  it('1〜31は許可', () => {
    expect(isValidDay(1)).toBe(true);
    expect(isValidDay(31)).toBe(true);
    expect(isValidDay(null)).toBe(true);
  });

  it('範囲外は拒否', () => {
    expect(isValidDay(0)).toBe(false);
    expect(isValidDay(32)).toBe(false);
  });
});

describe('isValidFrequency', () => {
  it('1〜12の整数は許可', () => {
    expect(isValidFrequency(1)).toBe(true);
    expect(isValidFrequency(4)).toBe(true);
    expect(isValidFrequency(12)).toBe(true);
    expect(isValidFrequency(null)).toBe(true);
  });

  it('小数・範囲外は拒否', () => {
    expect(isValidFrequency(0)).toBe(false);
    expect(isValidFrequency(13)).toBe(false);
    expect(isValidFrequency(1.5)).toBe(false);
  });
});

describe('isValidCashAmount', () => {
  it('有効な金額は許可', () => {
    expect(isValidCashAmount('0')).toBe(true);
    expect(isValidCashAmount('1000000')).toBe(true);
    expect(isValidCashAmount('99999999999')).toBe(true);
  });

  it('無効な値は拒否', () => {
    expect(isValidCashAmount('abc')).toBe(false);
    expect(isValidCashAmount('-1')).toBe(false);
    expect(isValidCashAmount('100000000000')).toBe(false);
    expect(isValidCashAmount('Infinity')).toBe(false);
  });
});
