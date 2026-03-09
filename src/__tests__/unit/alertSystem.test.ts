import { describe, it, expect } from 'vitest'
import {
  calculateGapPercentage,
  checkNextActionAlert,
  checkStopLossAlert,
  checkTargetProfitAlert,
  getIntegratedAlert,
  getAllActiveAlerts,
} from '@/utils/alertSystem'
import { createNextActionPlan, createPositionSummary } from '../helpers/mockFactories'

describe('calculateGapPercentage', () => {
  it('正常な乖離率を計算', () => {
    const result = calculateGapPercentage(1050, 1000)
    expect(result).toBe(5)
  })

  it('currentPrice=0以下の場合Infinity', () => {
    expect(calculateGapPercentage(0, 1000)).toBe(Infinity)
  })

  it('targetPrice=0以下の場合Infinity', () => {
    expect(calculateGapPercentage(1000, 0)).toBe(Infinity)
  })
})

describe('checkNextActionAlert', () => {
  it('目標未設定の場合null', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    expect(checkNextActionAlert(plan, 1500)).toBeNull()
  })

  it('資金不足の場合insufficient-funds', () => {
    const plan = createNextActionPlan({ actionType: 'buy', targetPrice: 1500, targetQuantity: 100 })
    const result = checkNextActionAlert(plan, 1500, undefined, 10000)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('insufficient-funds')
  })

  it('2%以内でapproaching', () => {
    const plan = createNextActionPlan({ targetPrice: 1510 })
    const result = checkNextActionAlert(plan, 1500, undefined, 200000)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('nextaction-approaching')
  })

  it('2-5%でwarning', () => {
    const plan = createNextActionPlan({ targetPrice: 1560 })
    const result = checkNextActionAlert(plan, 1500, undefined, 200000)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('nextaction-warning')
  })

  it('5%超の場合null', () => {
    const plan = createNextActionPlan({ targetPrice: 1700 })
    const result = checkNextActionAlert(plan, 1500, undefined, 200000)
    expect(result).toBeNull()
  })
})

describe('checkStopLossAlert', () => {
  it('stopLossPrice=0以下の場合null', () => {
    expect(checkStopLossAlert(1500, 0)).toBeNull()
  })

  it('損切ラインを下回っている場合stop-loss-exceeded', () => {
    const result = checkStopLossAlert(1350, 1400)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('stop-loss-exceeded')
  })

  it('5%以内の場合stop-loss', () => {
    const result = checkStopLossAlert(1420, 1400)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('stop-loss')
  })

  it('5%超の場合null', () => {
    const result = checkStopLossAlert(1600, 1400)
    expect(result).toBeNull()
  })
})

describe('checkTargetProfitAlert', () => {
  it('targetPrice=0以下の場合null', () => {
    expect(checkTargetProfitAlert(1500, 0)).toBeNull()
  })

  it('5%以内の場合target-profit', () => {
    const result = checkTargetProfitAlert(1580, 1600)
    expect(result).not.toBeNull()
    expect(result!.type).toBe('target-profit')
  })

  it('5%超の場合null', () => {
    const result = checkTargetProfitAlert(1400, 1600)
    expect(result).toBeNull()
  })
})

describe('getIntegratedAlert', () => {
  it('アラートなしの場合type=none', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    const result = getIntegratedAlert(plan, 1500, 0, '0')
    expect(result.type).toBe('none')
  })

  it('複数アラートがある場合、最も優先度が高いものを返す', () => {
    const plan = createNextActionPlan({ actionType: 'buy', targetPrice: 1510, targetQuantity: 100 })
    const result = getIntegratedAlert(plan, 1500, 1520, '1480', undefined, 10000)
    expect(result.type).toBe('insufficient-funds')
  })
})

describe('getAllActiveAlerts', () => {
  it('アラートなしの場合空配列', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    const result = getAllActiveAlerts(plan, 1500, 0, '0')
    expect(result).toEqual([])
  })

  it('複数アラートを優先順で返す', () => {
    const plan = createNextActionPlan({ actionType: 'buy', targetPrice: 1510, targetQuantity: 100 })
    const result = getAllActiveAlerts(plan, 1500, 1520, '1480', undefined, 10000)
    expect(result.length).toBeGreaterThanOrEqual(2)
    // insufficient-fundsが先
    expect(result[0].type).toBe('insufficient-funds')
  })

  it('現在価格0の場合空配列', () => {
    const plan = createNextActionPlan({ targetPrice: 1500 })
    const result = getAllActiveAlerts(plan, 0, 1600, '1400')
    expect(result).toEqual([])
  })

  it('stop-loss-exceededが含まれる', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    const result = getAllActiveAlerts(plan, 1350, 0, '1400')
    expect(result.some(a => a.type === 'stop-loss-exceeded')).toBe(true)
  })

  it('target-profitが含まれる', () => {
    const plan = createNextActionPlan({ targetPrice: null })
    const result = getAllActiveAlerts(plan, 1580, 1600, '0')
    expect(result.some(a => a.type === 'target-profit')).toBe(true)
  })
})
