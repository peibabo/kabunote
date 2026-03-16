import { describe, it, expect } from 'vitest'
import { calcYAxisDomain, formatDateLabel, transformChartData } from '@/lib/stockMiniChartCalc'

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
