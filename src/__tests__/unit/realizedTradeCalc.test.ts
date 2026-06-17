import { describe, it, expect } from 'vitest'
import { calculateRealizedTrade, summarizeRealizedTrades, formatAcquisitionPeriod } from '@/lib/realizedTradeCalc'
import type { RealizedTrade } from '@/types/realizedTrade'

const createTrade = (overrides?: Partial<RealizedTrade>): RealizedTrade => ({
  id: 'rt-1',
  stockId: 'stock-1',
  symbol: '7203',
  soldShares: 100,
  sellPrice: 1600,
  costBasis: 1500,
  sellDate: '2026-06-01',
  realizedPL: 10000,
  taxRate: 0.20315,
  consumedLots: [{ shares: 100, purchaseDate: '2024-01-01' }],
  memo: '',
  createdAt: '2026-06-01T00:00:00.000Z',
  ...overrides,
})

describe('calculateRealizedTrade', () => {
  it('利益が出る売却: 税引前・税引後・損益率・代金を計算', () => {
    const r = calculateRealizedTrade(100, 1600, 1500, 0.20315)
    expect(r.gross).toBe(10000) // (1600-1500)*100
    expect(r.proceeds).toBe(160000) // 1600*100
    expect(r.afterTax).toBeCloseTo(10000 * (1 - 0.20315), 5) // 利益のみ課税
    expect(r.plPercent).toBeCloseTo((100 / 1500) * 100, 5)
  })

  it('損失が出る売却: 税引後は課税せずそのまま（損益通算前提）', () => {
    const r = calculateRealizedTrade(100, 1400, 1500, 0.20315)
    expect(r.gross).toBe(-10000)
    expect(r.afterTax).toBe(-10000) // 損失は課税しない
    expect(r.plPercent).toBeCloseTo((-100 / 1500) * 100, 5)
  })

  it('NISA（税率0）: 利益が出ても税引後＝税引前', () => {
    const r = calculateRealizedTrade(100, 1600, 1500, 0)
    expect(r.gross).toBe(10000)
    expect(r.afterTax).toBe(10000)
  })

  it('一部売却: 売却株数分のみ計算', () => {
    const r = calculateRealizedTrade(30, 2000, 1000, 0)
    expect(r.gross).toBe(30000) // (2000-1000)*30
    expect(r.proceeds).toBe(60000)
    expect(r.plPercent).toBeCloseTo(100, 5) // 倍になった
  })

  it('原価0の場合、損益率は0（ゼロ除算回避）', () => {
    const r = calculateRealizedTrade(100, 1600, 0, 0)
    expect(r.plPercent).toBe(0)
  })
})

describe('summarizeRealizedTrades', () => {
  it('空配列はゼロ集計を返す', () => {
    expect(summarizeRealizedTrades([])).toEqual({
      totalGross: 0,
      totalAfterTax: 0,
      winCount: 0,
      lossCount: 0,
      tradeCount: 0,
    })
  })

  it('勝ち負けを集計し、税引後は各レコードごとに利益のみ課税して合算', () => {
    const trades = [
      createTrade({ realizedPL: 10000, taxRate: 0.20315 }), // 勝ち
      createTrade({ realizedPL: -5000, taxRate: 0.20315 }), // 負け
      createTrade({ realizedPL: 20000, taxRate: 0 }),       // 勝ち（NISA）
    ]
    const s = summarizeRealizedTrades(trades)
    expect(s.tradeCount).toBe(3)
    expect(s.winCount).toBe(2)
    expect(s.lossCount).toBe(1)
    expect(s.totalGross).toBe(25000) // 10000 - 5000 + 20000
    // 税引後: 10000*(1-0.20315) + (-5000) + 20000
    expect(s.totalAfterTax).toBeCloseTo(10000 * (1 - 0.20315) - 5000 + 20000, 5)
  })

  it('損益0は勝ちにも負けにもカウントしない', () => {
    const s = summarizeRealizedTrades([createTrade({ realizedPL: 0 })])
    expect(s.winCount).toBe(0)
    expect(s.lossCount).toBe(0)
    expect(s.tradeCount).toBe(1)
  })
})

describe('formatAcquisitionPeriod', () => {
  it('単一ロットは取得日をそのまま返す', () => {
    expect(formatAcquisitionPeriod([{ shares: 100, purchaseDate: '2024-03-01' }])).toBe('2024-03-01')
  })

  it('同一取得日の複数ロットは単一日付として返す', () => {
    expect(formatAcquisitionPeriod([
      { shares: 50, purchaseDate: '2024-03-01' },
      { shares: 50, purchaseDate: '2024-03-01' },
    ])).toBe('2024-03-01')
  })

  it('取得日が異なる複数ロットは最古〜最新の期間を返す', () => {
    expect(formatAcquisitionPeriod([
      { shares: 60, purchaseDate: '2025-03-10' },
      { shares: 40, purchaseDate: '2024-01-01' },
    ])).toBe('2024-01-01〜2025-03-10')
  })

  it('取得日が空のロットは無視する', () => {
    expect(formatAcquisitionPeriod([
      { shares: 60, purchaseDate: '' },
      { shares: 40, purchaseDate: '2024-01-01' },
    ])).toBe('2024-01-01')
  })

  it('取得日が1件も無ければ空文字を返す', () => {
    expect(formatAcquisitionPeriod([{ shares: 100, purchaseDate: '' }])).toBe('')
    expect(formatAcquisitionPeriod([])).toBe('')
  })
})
