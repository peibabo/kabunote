import { describe, it, expect } from 'vitest'
import {
  calculatePositionSummary,
  calculateProfitLoss,
  calculatePortfolioTargetSummary,
  formatPrice,
  formatShares,
  formatProfitLoss,
} from '@/types/positions'
import { createPosition, createPositionSummary, createStockTargetInfo, createProfitLossInfo } from '../helpers/mockFactories'

describe('calculatePositionSummary', () => {
  it('空配列の場合ゼロを返す', () => {
    const result = calculatePositionSummary([])
    expect(result).toEqual({
      totalShares: 0,
      averagePrice: 0,
      totalCost: 0,
      positionCount: 0,
    })
  })

  it('単一ポジションの場合', () => {
    const result = calculatePositionSummary([
      createPosition({ shares: 100, purchasePrice: 1500 }),
    ])
    expect(result.totalShares).toBe(100)
    expect(result.averagePrice).toBe(1500)
    expect(result.totalCost).toBe(150000)
    expect(result.positionCount).toBe(1)
  })

  it('複数ポジションの場合、加重平均を計算する', () => {
    const result = calculatePositionSummary([
      createPosition({ shares: 100, purchasePrice: 1000 }),
      createPosition({ shares: 200, purchasePrice: 1500 }),
    ])
    expect(result.totalShares).toBe(300)
    expect(result.totalCost).toBe(400000)
    expect(result.averagePrice).toBeCloseTo(1333.33, 1)
    expect(result.positionCount).toBe(2)
  })

  it('株数0のポジションがある場合、averagePriceが正しい', () => {
    const result = calculatePositionSummary([
      createPosition({ shares: 0, purchasePrice: 1500 }),
    ])
    expect(result.totalShares).toBe(0)
    expect(result.averagePrice).toBe(0)
    expect(result.totalCost).toBe(0)
  })
})

describe('calculateProfitLoss', () => {
  it('正常な損益計算', () => {
    const summary = createPositionSummary({ totalShares: 100, averagePrice: 1500, totalCost: 150000 })
    const result = calculateProfitLoss(summary, 1600, 1400)
    expect(result).not.toBeNull()
    expect(result!.targetProfit).toBe(10000)
    expect(result!.targetProfitPercent).toBeCloseTo(6.67, 1)
    expect(result!.stopLoss).toBe(-10000)
    expect(result!.stopLossPercent).toBeCloseTo(-6.67, 1)
  })

  it('nullの場合（totalShares=0）', () => {
    const summary = createPositionSummary({ totalShares: 0, averagePrice: 0, totalCost: 0 })
    const result = calculateProfitLoss(summary)
    expect(result).toBeNull()
  })

  it('NaN値の場合nullを返す', () => {
    const summary = createPositionSummary({ totalShares: NaN, averagePrice: 1500, totalCost: 150000 })
    const result = calculateProfitLoss(summary, 1600)
    expect(result).toBeNull()
  })

  it('目標価格のみ設定', () => {
    const summary = createPositionSummary({ totalShares: 100, averagePrice: 1500 })
    const result = calculateProfitLoss(summary, 1600)
    expect(result).not.toBeNull()
    expect(result!.targetProfit).toBe(10000)
    expect(result!.stopLoss).toBe(0)
  })

  it('損切のみ設定', () => {
    const summary = createPositionSummary({ totalShares: 100, averagePrice: 1500 })
    const result = calculateProfitLoss(summary, undefined, 1400)
    expect(result).not.toBeNull()
    expect(result!.targetProfit).toBe(0)
    expect(result!.stopLoss).toBe(-10000)
  })

  it('マイナスの利益（現在値が取得価格より下）', () => {
    const summary = createPositionSummary({ totalShares: 100, averagePrice: 1500 })
    const result = calculateProfitLoss(summary, 1400)
    expect(result).not.toBeNull()
    expect(result!.targetProfit).toBe(-10000)
    expect(result!.targetProfitPercent).toBeCloseTo(-6.67, 1)
  })

  it('averagePrice=0の場合nullを返す', () => {
    const summary = createPositionSummary({ totalShares: 100, averagePrice: 0, totalCost: 0 })
    const result = calculateProfitLoss(summary, 1600)
    expect(result).toBeNull()
  })
})

describe('calculatePortfolioTargetSummary', () => {
  it('空配列の場合', () => {
    const result = calculatePortfolioTargetSummary([])
    expect(result.totalTargetProfit).toBe(0)
    expect(result.totalStopLoss).toBe(0)
    expect(result.riskRewardRatio).toBeNull()
    expect(result.targetSetCount).toBe(0)
    expect(result.totalStocksWithPosition).toBe(0)
  })

  it('ポジションなしの銘柄は除外する', () => {
    const result = calculatePortfolioTargetSummary([
      createStockTargetInfo({
        positionSummary: createPositionSummary({ totalShares: 0 }),
      }),
    ])
    expect(result.totalStocksWithPosition).toBe(0)
  })

  it('正常なカウント', () => {
    const result = calculatePortfolioTargetSummary([
      createStockTargetInfo({ targetPrice: 1600, stopLossPrice: 1400 }),
      createStockTargetInfo({ targetPrice: 2000, stopLossPrice: undefined }),
    ])
    expect(result.totalStocksWithPosition).toBe(2)
    expect(result.targetSetCount).toBe(2)
    expect(result.stopLossSetCount).toBe(1)
  })

  it('リスクリワード比が計算される', () => {
    const result = calculatePortfolioTargetSummary([
      createStockTargetInfo({
        profitLossInfo: createProfitLossInfo({ targetProfit: 20000, stopLoss: -10000 }),
        targetPrice: 1600,
        stopLossPrice: 1400,
      }),
    ])
    expect(result.riskRewardRatio).toBeCloseTo(2.0, 1)
  })

  it('損失0の場合riskRewardRatioはnull', () => {
    const result = calculatePortfolioTargetSummary([
      createStockTargetInfo({
        profitLossInfo: createProfitLossInfo({ targetProfit: 10000, stopLoss: 0 }),
        targetPrice: 1600,
        stopLossPrice: 1400,
      }),
    ])
    expect(result.riskRewardRatio).toBeNull()
  })
})

describe('formatPrice', () => {
  it('通常の数値をフォーマット', () => {
    expect(formatPrice(1500)).toBe('1,500')
  })

  it('大きな数値をフォーマット', () => {
    expect(formatPrice(1234567)).toBe('1,234,567')
  })
})

describe('formatShares', () => {
  it('株数をフォーマット', () => {
    expect(formatShares(1000)).toBe('1,000')
  })

  it('小さい数値', () => {
    expect(formatShares(1)).toBe('1')
  })
})

describe('formatProfitLoss', () => {
  it('プラスの場合+を付ける', () => {
    expect(formatProfitLoss(10000)).toBe('+10,000')
  })

  it('マイナスの場合-を付ける', () => {
    expect(formatProfitLoss(-5000)).toBe('-5,000')
  })

  it('NaNの場合---を返す', () => {
    expect(formatProfitLoss(NaN)).toBe('---')
  })

  it('Infinityの場合---を返す', () => {
    expect(formatProfitLoss(Infinity)).toBe('---')
  })
})
