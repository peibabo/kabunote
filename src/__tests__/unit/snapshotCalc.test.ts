import { describe, it, expect } from 'vitest'
import { buildSnapshotData, RANGE_DAYS } from '@/lib/snapshotCalc'
import { createPosition } from '../helpers/mockFactories'

describe('buildSnapshotData', () => {
  it('空配列の場合ゼロを返す', () => {
    const result = buildSnapshotData([], 100000)
    expect(result.totalInvestment).toBe(0)
    expect(result.totalValue).toBe(0)
    expect(result.profitLoss).toBe(0)
    expect(result.cashAmount).toBe(100000)
    expect(result.netAssets).toBe(100000)
    expect(result.stockSnapshots).toHaveLength(0)
  })

  it('ポジションなし・株価設定済みの銘柄は株価のみ記録する', () => {
    const result = buildSnapshotData([
      { id: 'stock-1', symbol: '7203', currentPrice: 2000, positions: [] },
    ], 0)
    expect(result.stockSnapshots).toHaveLength(1)
    expect(result.stockSnapshots[0]).toEqual({
      stockId: 'stock-1',
      symbol: '7203',
      currentPrice: 2000,
      shares: 0,
      value: 0,
      cost: 0,
    })
    expect(result.totalInvestment).toBe(0)
    expect(result.totalValue).toBe(0)
    expect(result.profitLoss).toBe(0)
  })

  it('ポジションなし・株価未設定の銘柄はスキップする', () => {
    const result = buildSnapshotData([
      { id: 'stock-1', symbol: '7203', currentPrice: null, positions: [] },
    ], 0)
    expect(result.stockSnapshots).toHaveLength(0)
  })

  it('ポジションなし・株価0の銘柄はスキップする', () => {
    const result = buildSnapshotData([
      { id: 'stock-1', symbol: '7203', currentPrice: 0, positions: [] },
    ], 0)
    expect(result.stockSnapshots).toHaveLength(0)
  })

  it('株価設定済みの銘柄を正しく計算する', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: 2000,
        positions: [
          createPosition({ shares: 100, purchasePrice: 1500 }),
        ],
      },
    ], 500000)

    expect(result.totalInvestment).toBe(150000)
    expect(result.totalValue).toBe(200000)
    expect(result.profitLoss).toBe(50000)
    expect(result.cashAmount).toBe(500000)
    expect(result.netAssets).toBe(700000)
    expect(result.stockSnapshots).toHaveLength(1)
    expect(result.stockSnapshots[0]).toEqual({
      stockId: 'stock-1',
      symbol: '7203',
      currentPrice: 2000,
      shares: 100,
      value: 200000,
      cost: 150000,
    })
  })

  it('株価未設定の場合、投資額を評価額として使用する', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: null,
        positions: [
          createPosition({ shares: 100, purchasePrice: 1500 }),
        ],
      },
    ], 0)

    expect(result.totalValue).toBe(150000) // cost = value
    expect(result.profitLoss).toBe(0)
    expect(result.stockSnapshots[0].value).toBe(150000)
    expect(result.stockSnapshots[0].currentPrice).toBeNull()
  })

  it('株価0の場合、投資額を評価額として使用する', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: 0,
        positions: [
          createPosition({ shares: 100, purchasePrice: 1500 }),
        ],
      },
    ], 0)

    expect(result.totalValue).toBe(150000)
  })

  it('複数銘柄の合算が正しい', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: 2000,
        positions: [
          createPosition({ shares: 100, purchasePrice: 1500 }),
        ],
      },
      {
        id: 'stock-2',
        symbol: '9984',
        currentPrice: 5000,
        positions: [
          createPosition({ shares: 200, purchasePrice: 4000 }),
        ],
      },
    ], 300000)

    // stock-1: cost=150000, value=200000
    // stock-2: cost=800000, value=1000000
    expect(result.totalInvestment).toBe(950000)
    expect(result.totalValue).toBe(1200000)
    expect(result.profitLoss).toBe(250000)
    expect(result.netAssets).toBe(1500000)
    expect(result.stockSnapshots).toHaveLength(2)
  })

  it('株数0のポジション・株価設定済みの銘柄は株価のみ記録する', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: 2000,
        positions: [
          createPosition({ shares: 0, purchasePrice: 1500 }),
        ],
      },
    ], 0)
    expect(result.stockSnapshots).toHaveLength(1)
    expect(result.stockSnapshots[0].shares).toBe(0)
    expect(result.stockSnapshots[0].value).toBe(0)
    expect(result.stockSnapshots[0].cost).toBe(0)
    expect(result.stockSnapshots[0].currentPrice).toBe(2000)
    expect(result.totalInvestment).toBe(0)
    expect(result.totalValue).toBe(0)
  })

  it('保有銘柄と未保有銘柄が混在する場合、集計は保有分のみ', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: 2000,
        positions: [createPosition({ shares: 100, purchasePrice: 1500 })],
      },
      {
        id: 'stock-2',
        symbol: '9984',
        currentPrice: 5000,
        positions: [],
      },
    ], 100000)

    expect(result.stockSnapshots).toHaveLength(2)
    expect(result.totalInvestment).toBe(150000)
    expect(result.totalValue).toBe(200000)
    expect(result.profitLoss).toBe(50000)
    expect(result.netAssets).toBe(300000)

    const noPosition = result.stockSnapshots.find(s => s.stockId === 'stock-2')!
    expect(noPosition.shares).toBe(0)
    expect(noPosition.value).toBe(0)
    expect(noPosition.cost).toBe(0)
    expect(noPosition.currentPrice).toBe(5000)
  })

  it('複数ロットの合算が正しい', () => {
    const result = buildSnapshotData([
      {
        id: 'stock-1',
        symbol: '7203',
        currentPrice: 2000,
        positions: [
          createPosition({ shares: 100, purchasePrice: 1500 }),
          createPosition({ shares: 200, purchasePrice: 1800 }),
        ],
      },
    ], 0)

    // cost = 100*1500 + 200*1800 = 150000 + 360000 = 510000
    // value = 2000 * 300 = 600000
    expect(result.totalInvestment).toBe(510000)
    expect(result.totalValue).toBe(600000)
    expect(result.stockSnapshots[0].shares).toBe(300)
    expect(result.stockSnapshots[0].cost).toBe(510000)
    expect(result.stockSnapshots[0].value).toBe(600000)
  })
})

describe('RANGE_DAYS', () => {
  it('各期間の日数が正しい', () => {
    expect(RANGE_DAYS['1W']).toBe(7)
    expect(RANGE_DAYS['1M']).toBe(30)
    expect(RANGE_DAYS['3M']).toBe(90)
    expect(RANGE_DAYS['6M']).toBe(180)
    expect(RANGE_DAYS['1Y']).toBe(365)
    expect(RANGE_DAYS['2Y']).toBe(730)
  })
})
