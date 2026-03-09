import { describe, it, expect } from 'vitest'
import {
  calculateDividendYield,
  calculateAnnualDividend,
  calculateAfterTaxDividend,
  calculateDividendInfo,
  formatDividendAmount,
  formatDividendYield,
} from '@/types/dividend'

describe('calculateDividendYield', () => {
  it('正常な配当利回り計算', () => {
    const result = calculateDividendYield(50, 2, 2000)
    expect(result).toBe(5.0)
  })

  it('averagePrice=0以下の場合0を返す', () => {
    expect(calculateDividendYield(50, 2, 0)).toBe(0)
    expect(calculateDividendYield(50, 2, -100)).toBe(0)
  })

  it('年4回配当', () => {
    const result = calculateDividendYield(25, 4, 2000)
    expect(result).toBe(5.0)
  })

  it('年1回配当', () => {
    const result = calculateDividendYield(100, 1, 2000)
    expect(result).toBe(5.0)
  })
})

describe('calculateAnnualDividend', () => {
  it('正常な年間配当計算', () => {
    const result = calculateAnnualDividend(50, 2, 100)
    expect(result).toBe(10000)
  })

  it('株数0の場合0を返す', () => {
    expect(calculateAnnualDividend(50, 2, 0)).toBe(0)
  })
})

describe('calculateAfterTaxDividend', () => {
  it('税率20.315%が適用される', () => {
    const result = calculateAfterTaxDividend(10000)
    expect(result).toBeCloseTo(7968.5, 0)
  })

  it('0円の場合0を返す', () => {
    expect(calculateAfterTaxDividend(0)).toBe(0)
  })
})

describe('calculateDividendInfo', () => {
  it('全指標をまとめて計算', () => {
    const result = calculateDividendInfo(50, 2, 100, 2000)
    expect(result.annualDividend).toBe(10000)
    expect(result.dividendYield).toBe(5.0)
    expect(result.afterTaxAmount).toBeCloseTo(7968.5, 0)
    expect(result.taxAmount).toBeCloseTo(2031.5, 0)
  })

  it('税額の整合性（税引前 = 税引後 + 税額）', () => {
    const result = calculateDividendInfo(100, 1, 200, 5000)
    expect(result.annualDividend).toBeCloseTo(result.afterTaxAmount + result.taxAmount, 5)
  })
})

describe('formatDividendAmount', () => {
  it('金額をフォーマット', () => {
    expect(formatDividendAmount(10000)).toBe('10,000')
  })

  it('小数点を丸める', () => {
    expect(formatDividendAmount(7968.5)).toBe('7,969')
  })

  it('0の場合', () => {
    expect(formatDividendAmount(0)).toBe('0')
  })
})

describe('formatDividendYield', () => {
  it('小数点2桁でフォーマット', () => {
    expect(formatDividendYield(5.0)).toBe('5.00')
  })

  it('小数点以下を丸める', () => {
    expect(formatDividendYield(3.456)).toBe('3.46')
  })
})
