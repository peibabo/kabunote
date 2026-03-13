import { describe, it, expect } from 'vitest'
import {
  analyzeNextActionPlan,
  hasNextActionPlan,
  isCompleteNextActionPlan,
  createDefaultNextActionPlan,
} from '@/lib/nextActionPlanCalc'
import { createNextActionPlan } from '../helpers/mockFactories'

describe('analyzeNextActionPlan', () => {
  it('目標未設定の場合、priceGapが-currentPrice', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    const result = analyzeNextActionPlan(plan, 1500)
    // targetPrice=nullの場合 (0 - 1500) / 1500 * 100 = -100
    expect(result.gapPercentage).toBe(-100)
    expect(result.priceGap).toBe(-1500)
  })

  it('2%以内でisApproaching=true', () => {
    const plan = createNextActionPlan({ targetPrice: 1510 })
    const result = analyzeNextActionPlan(plan, 1500)
    expect(result.isApproaching).toBe(true)
    expect(result.isWarning).toBe(false)
  })

  it('2-5%でisWarning=true', () => {
    const plan = createNextActionPlan({ targetPrice: 1560 })
    const result = analyzeNextActionPlan(plan, 1500)
    expect(result.isApproaching).toBe(false)
    expect(result.isWarning).toBe(true)
  })

  it('5%超でどちらもfalse', () => {
    const plan = createNextActionPlan({ targetPrice: 1700 })
    const result = analyzeNextActionPlan(plan, 1500)
    expect(result.isApproaching).toBe(false)
    expect(result.isWarning).toBe(false)
  })

  it('現在価格0の場合', () => {
    const plan = createNextActionPlan({ targetPrice: 1500 })
    const result = analyzeNextActionPlan(plan, 0)
    expect(result.gapPercentage).toBe(0)
  })

  it('buy+保有ありの場合、predictedAveragePriceが計算される', () => {
    const plan = createNextActionPlan({ actionType: 'buy', targetPrice: 1400, targetQuantity: 100 })
    const result = analyzeNextActionPlan(plan, 1500, { totalShares: 100, totalCost: 150000 })
    expect(result.predictedAveragePrice).toBeDefined()
    expect(result.predictedAveragePrice).toBeCloseTo(1450, 0)
  })

  it('sellの場合、canExecute=true', () => {
    const plan = createNextActionPlan({ actionType: 'sell', targetPrice: 1600 })
    const result = analyzeNextActionPlan(plan, 1500, null, 0)
    expect(result.canExecute).toBe(true)
  })

  it('資金不足の場合canExecute=false', () => {
    const plan = createNextActionPlan({ actionType: 'buy', targetPrice: 1500, targetQuantity: 100 })
    const result = analyzeNextActionPlan(plan, 1500, null, 10000)
    expect(result.canExecute).toBe(false)
    expect(result.requiredInvestment).toBe(150000)
  })

  it('資金充足の場合canExecute=true', () => {
    const plan = createNextActionPlan({ actionType: 'buy', targetPrice: 1500, targetQuantity: 100 })
    const result = analyzeNextActionPlan(plan, 1500, null, 200000)
    expect(result.canExecute).toBe(true)
    expect(result.cashAfterInvestment).toBe(50000)
  })
})

describe('hasNextActionPlan', () => {
  it('デフォルトの場合false', () => {
    const plan = createDefaultNextActionPlan()
    expect(hasNextActionPlan(plan)).toBe(false)
  })

  it('targetPrice設定でtrue', () => {
    const plan = createDefaultNextActionPlan()
    plan.targetPrice = 1500
    expect(hasNextActionPlan(plan)).toBe(true)
  })

  it('memo設定でtrue', () => {
    const plan = createDefaultNextActionPlan()
    plan.memo = 'テスト'
    expect(hasNextActionPlan(plan)).toBe(true)
  })

  it('actionType変更でtrue', () => {
    const plan = createDefaultNextActionPlan()
    plan.actionType = 'sell'
    expect(hasNextActionPlan(plan)).toBe(true)
  })

  it('空白のみのmemoはfalse', () => {
    const plan = createDefaultNextActionPlan()
    plan.memo = '   '
    expect(hasNextActionPlan(plan)).toBe(false)
  })
})

describe('isCompleteNextActionPlan', () => {
  it('全て設定されていればtrue', () => {
    const plan = createNextActionPlan({ targetPrice: 1500, targetQuantity: 100 })
    expect(isCompleteNextActionPlan(plan)).toBe(true)
  })

  it('targetPrice=nullの場合false', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    expect(isCompleteNextActionPlan(plan)).toBe(false)
  })

  it('targetQuantity=nullの場合false', () => {
    const plan = createNextActionPlan({ targetQuantity: null })
    expect(isCompleteNextActionPlan(plan)).toBe(false)
  })
})
