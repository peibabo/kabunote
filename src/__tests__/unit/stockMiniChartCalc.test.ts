import { describe, it, expect } from 'vitest'
import { calcYAxisDomain, formatDateLabel, transformChartData, buildTradeMarkerMap } from '@/lib/stockMiniChartCalc'
import type { TradeMarkerEntry } from '@/lib/stockMiniChartCalc'

describe('calcYAxisDomain', () => {
  it('空配列の場合はデフォルト値を返す', () => {
    const [min, max] = calcYAxisDomain([])
    expect(min).toBe(0)
    expect(max).toBe(100)
  })

  it('price が null のみの場合はデフォルト値を返す', () => {
    const [min, max] = calcYAxisDomain([{ price: null }, { price: null }])
    expect(min).toBe(0)
    expect(max).toBe(100)
  })

  it('株価のみから domain を計算する', () => {
    const [min, max] = calcYAxisDomain([
      { price: 1000 },
      { price: 1200 },
      { price: 1100 },
    ])
    // margin = (1200 - 1000) * 0.1 = 20
    expect(min).toBe(Math.max(0, Math.floor(1000 - 20))) // 980
    expect(max).toBe(Math.ceil(1200 + 20)) // 1220
  })

  it('targetPrice を考慮する', () => {
    const [min, max] = calcYAxisDomain(
      [{ price: 1000 }, { price: 1100 }],
      1500, // targetPrice
    )
    // prices = [1000, 1100, 1500], margin = (1500 - 1000) * 0.1 = 50
    expect(min).toBe(Math.max(0, Math.floor(1000 - 50))) // 950
    expect(max).toBe(Math.ceil(1500 + 50)) // 1550
  })

  it('stopLossPrice を考慮する', () => {
    const [min, max] = calcYAxisDomain(
      [{ price: 1000 }, { price: 1100 }],
      undefined,
      800, // stopLossPrice
    )
    // prices = [1000, 1100, 800], margin = (1100 - 800) * 0.1 = 30
    expect(min).toBe(Math.max(0, Math.floor(800 - 30))) // 770
    expect(max).toBe(Math.ceil(1100 + 30)) // 1130
  })

  it('targetPrice と stopLossPrice の両方を考慮する', () => {
    const [min, max] = calcYAxisDomain(
      [{ price: 1000 }],
      1500,
      800,
    )
    // prices = [1000, 1500, 800], margin = (1500 - 800) * 0.1 = 70
    expect(min).toBe(Math.max(0, Math.floor(800 - 70))) // 730
    expect(max).toBe(Math.ceil(1500 + 70)) // 1570
  })

  it('0 以下の targetPrice/stopLossPrice は無視する', () => {
    const [min, max] = calcYAxisDomain(
      [{ price: 1000 }, { price: 1200 }],
      0,
      -100,
    )
    // prices = [1000, 1200], margin = 20
    expect(min).toBe(Math.max(0, Math.floor(1000 - 20)))
    expect(max).toBe(Math.ceil(1200 + 20))
  })

  it('同一価格の場合でも適切なマージンを持つ', () => {
    const [min, max] = calcYAxisDomain([{ price: 1000 }, { price: 1000 }])
    // margin = 0 * 0.1 = 0 → max * 0.05 = 50
    expect(min).toBe(Math.max(0, Math.floor(1000 - 50)))
    expect(max).toBe(Math.ceil(1000 + 50))
  })
})

describe('formatDateLabel', () => {
  it('YYYY-MM-DD を M/D 形式に変換する', () => {
    expect(formatDateLabel('2024-06-15')).toBe('6/15')
    expect(formatDateLabel('2024-01-01')).toBe('1/1')
    expect(formatDateLabel('2024-12-31')).toBe('12/31')
  })
})

describe('transformChartData', () => {
  it('履歴データをチャート用に変換する', () => {
    const result = transformChartData([
      { date: '2024-06-15', price: 1000 },
      { date: '2024-06-16', price: null },
    ])
    expect(result).toEqual([
      { date: '6/15', fullDate: '2024-06-15', price: 1000 },
      { date: '6/16', fullDate: '2024-06-16', price: null },
    ])
  })
})

describe('buildTradeMarkerMap', () => {
  const snapshots = ['2024-06-10', '2024-06-15', '2024-06-20', '2024-06-25']
  const buy = (date: string): TradeMarkerEntry => ({ date, shares: 100, price: 1000 })
  const sell = (date: string): TradeMarkerEntry => ({ date, shares: 50, price: 1200 })

  it('完全一致するスナップショットに割り当てる', () => {
    const map = buildTradeMarkerMap(snapshots, [buy('2024-06-15')], [])
    expect(map.get('2024-06-15')?.buys).toHaveLength(1)
    expect(map.size).toBe(1)
  })

  it('一致しない取引日は最近傍のスナップショットにスナップする', () => {
    // 6/16 は 6/15 に最も近い
    const map = buildTradeMarkerMap(snapshots, [buy('2024-06-16')], [])
    expect(map.get('2024-06-15')?.buys).toHaveLength(1)
    expect(map.has('2024-06-20')).toBe(false)
  })

  it('範囲外（最古より前）でも最近傍に寄せる', () => {
    const map = buildTradeMarkerMap(snapshots, [buy('2024-01-01')], [])
    expect(map.get('2024-06-10')?.buys).toHaveLength(1)
  })

  it('範囲外（最新より後）でも最近傍に寄せる', () => {
    const map = buildTradeMarkerMap(snapshots, [], [sell('2024-12-31')])
    expect(map.get('2024-06-25')?.sells).toHaveLength(1)
  })

  it('同一スナップショット日に複数の購入を集約する', () => {
    const map = buildTradeMarkerMap(
      snapshots,
      [buy('2024-06-15'), buy('2024-06-14'), buy('2024-06-16')],
      [],
    )
    // 6/14, 6/15, 6/16 はすべて 6/15 にスナップ
    expect(map.get('2024-06-15')?.buys).toHaveLength(3)
    expect(map.size).toBe(1)
  })

  it('購入と売却を同じセルに共存させる', () => {
    const map = buildTradeMarkerMap(snapshots, [buy('2024-06-20')], [sell('2024-06-20')])
    const cell = map.get('2024-06-20')
    expect(cell?.buys).toHaveLength(1)
    expect(cell?.sells).toHaveLength(1)
  })

  it('date が空文字の取引は除外する', () => {
    const map = buildTradeMarkerMap(snapshots, [buy(''), buy('2024-06-15')], [])
    expect(map.size).toBe(1)
    expect(map.get('2024-06-15')?.buys).toHaveLength(1)
  })

  it('スナップショットが空なら空マップを返す', () => {
    const map = buildTradeMarkerMap([], [buy('2024-06-15')], [])
    expect(map.size).toBe(0)
  })
})
