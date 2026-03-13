import { describe, it, expect } from 'vitest'
import {
  calculateShareholderBenefit,
  formatBenefitValue,
  formatBenefitYield,
} from '@/lib/shareholderCalc'

describe('calculateShareholderBenefit', () => {
  it('資格あり（十分な株数）', () => {
    const result = calculateShareholderBenefit(100, 200, 5000, 300000)
    expect(result.isEligible).toBe(true)
    expect(result.shortfall).toBe(0)
    expect(result.estimatedValue).toBe(5000)
    expect(result.yieldOnInvestment).toBeCloseTo(1.67, 1)
  })

  it('資格なし（不足株数）', () => {
    const result = calculateShareholderBenefit(200, 100, 5000, 150000)
    expect(result.isEligible).toBe(false)
    expect(result.shortfall).toBe(100)
    expect(result.estimatedValue).toBe(0)
    expect(result.yieldOnInvestment).toBe(0)
  })

  it('ちょうどの株数で資格あり', () => {
    const result = calculateShareholderBenefit(100, 100, 3000, 150000)
    expect(result.isEligible).toBe(true)
    expect(result.shortfall).toBe(0)
  })

  it('投資額0の場合、利回りは0', () => {
    const result = calculateShareholderBenefit(100, 200, 5000, 0)
    expect(result.isEligible).toBe(true)
    expect(result.yieldOnInvestment).toBe(0)
  })

  it('不足株数が正確', () => {
    const result = calculateShareholderBenefit(500, 350, 10000, 525000)
    expect(result.shortfall).toBe(150)
  })
})

describe('formatBenefitValue', () => {
  it('金額をフォーマット', () => {
    expect(formatBenefitValue(5000)).toBe('5,000')
  })

  it('小数点を丸める', () => {
    expect(formatBenefitValue(1234.5)).toBe('1,235')
  })
})

describe('formatBenefitYield', () => {
  it('利回りをフォーマット', () => {
    expect(formatBenefitYield(1.666)).toBe('1.67')
  })

  it('0の場合', () => {
    expect(formatBenefitYield(0)).toBe('0.00')
  })
})
