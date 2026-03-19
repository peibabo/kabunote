import { describe, it, expect } from 'vitest'
import {
  DEFAULT_TAX_RATE,
  NISA_TAX_RATE,
  calculateAfterTax,
  calculateWeightedTaxRate,
} from '@/lib/taxCalc'

describe('calculateAfterTax', () => {
  it('特定口座の税引後計算', () => {
    const result = calculateAfterTax(10000, DEFAULT_TAX_RATE)
    expect(result).toBeCloseTo(7968.5, 1)
  })

  it('NISA口座は非課税', () => {
    const result = calculateAfterTax(10000, NISA_TAX_RATE)
    expect(result).toBe(10000)
  })

  it('金額0の場合', () => {
    expect(calculateAfterTax(0, DEFAULT_TAX_RATE)).toBe(0)
  })
})

describe('calculateWeightedTaxRate', () => {
  it('全てNISAの場合は0', () => {
    const positions = [
      { shares: 100, taxRate: 0 },
      { shares: 200, taxRate: 0 },
    ]
    expect(calculateWeightedTaxRate(positions)).toBe(0)
  })

  it('全て特定口座の場合はDEFAULT_TAX_RATE', () => {
    const positions = [
      { shares: 100, taxRate: DEFAULT_TAX_RATE },
      { shares: 200, taxRate: DEFAULT_TAX_RATE },
    ]
    expect(calculateWeightedTaxRate(positions)).toBeCloseTo(DEFAULT_TAX_RATE, 5)
  })

  it('NISA + 特定口座混在の場合は株数加重平均', () => {
    const positions = [
      { shares: 100, taxRate: 0 },           // NISA 100株
      { shares: 200, taxRate: DEFAULT_TAX_RATE }, // 特定 200株
    ]
    // 加重平均: (100*0 + 200*0.20315) / 300 = 0.20315 * 2/3
    const expected = DEFAULT_TAX_RATE * (200 / 300)
    expect(calculateWeightedTaxRate(positions)).toBeCloseTo(expected, 5)
  })

  it('空配列の場合はDEFAULT_TAX_RATE', () => {
    expect(calculateWeightedTaxRate([])).toBe(DEFAULT_TAX_RATE)
  })

  it('株数0の場合はDEFAULT_TAX_RATE', () => {
    const positions = [{ shares: 0, taxRate: 0 }]
    expect(calculateWeightedTaxRate(positions)).toBe(DEFAULT_TAX_RATE)
  })
})
