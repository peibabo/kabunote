import { describe, it, expect } from 'vitest'
import {
  addDaysToDateStr,
  reconstructPositionsAt,
  findMissingBusinessDays,
  validateBackfillDate,
  hasHoldingsAt,
  toBackfillInputs,
  type BackfillTradeInput,
} from '@/lib/snapshotBackfill'
import type { Position } from '@/types/positions'

function pos(overrides: Partial<Position>): Position {
  return {
    id: 'p',
    shares: 100,
    purchasePrice: 1000,
    purchaseDate: '2026-11-01',
    taxRate: 0.20315,
    createdAt: '2026-11-01T00:00:00.000Z',
    ...overrides,
  }
}

function trade(overrides: Partial<BackfillTradeInput>): BackfillTradeInput {
  return {
    id: 't1',
    sellDate: '2026-11-18',
    costBasis: 1200,
    taxRate: 0,
    consumedLots: [{ shares: 50, purchaseDate: '2026-11-02' }],
    ...overrides,
  }
}

describe('addDaysToDateStr', () => {
  it('月・年をまたいで加減算できる', () => {
    expect(addDaysToDateStr('2026-11-30', 1)).toBe('2026-12-01')
    expect(addDaysToDateStr('2026-01-01', -1)).toBe('2025-12-31')
    expect(addDaysToDateStr('2028-02-28', 1)).toBe('2028-02-29')
  })
})

describe('reconstructPositionsAt', () => {
  it('その日以前に取得したポジションだけ残す', () => {
    const result = reconstructPositionsAt('2026-11-10', [
      pos({ id: 'a', purchaseDate: '2026-11-10' }),
      pos({ id: 'b', purchaseDate: '2026-11-11' }),
    ], [])
    expect(result.map(p => p.id)).toEqual(['a'])
  })

  it('取得日が空なら登録日（JST）で判定する', () => {
    // 2026-11-10T16:00Z は JST で 11/11
    const result = reconstructPositionsAt('2026-11-10', [
      pos({ id: 'a', purchaseDate: '', createdAt: '2026-11-10T14:00:00.000Z' }),
      pos({ id: 'b', purchaseDate: '', createdAt: '2026-11-10T16:00:00.000Z' }),
    ], [])
    expect(result.map(p => p.id)).toEqual(['a'])
  })

  it('その日より後に売却したロットを costBasis で足し戻す', () => {
    const result = reconstructPositionsAt('2026-11-10', [pos({ id: 'a', shares: 50 })], [trade({})])
    expect(result).toHaveLength(2)
    const restored = result[1]
    expect(restored.shares).toBe(50)
    expect(restored.purchasePrice).toBe(1200)
    expect(restored.taxRate).toBe(0)
  })

  it('その日以前に売却したロットは足し戻さない', () => {
    const result = reconstructPositionsAt('2026-11-18', [pos({ id: 'a', shares: 50 })], [trade({ sellDate: '2026-11-18' })])
    expect(result.map(p => p.id)).toEqual(['a'])
  })

  it('売却ロットでもその日より後に取得したものは足し戻さない', () => {
    const result = reconstructPositionsAt('2026-11-10', [], [
      trade({ consumedLots: [{ shares: 30, purchaseDate: '2026-11-12' }, { shares: 20, purchaseDate: '' }] }),
    ])
    // 取得日が空のロットは保有していた扱い
    expect(result.map(p => p.shares)).toEqual([20])
  })

  it('全株売却済みでも売却前の日なら保有を再現できる', () => {
    const result = reconstructPositionsAt('2026-11-05', [], [
      trade({ consumedLots: [{ shares: 100, purchaseDate: '2026-11-02' }] }),
    ])
    expect(result.reduce((s, p) => s + p.shares, 0)).toBe(100)
  })
})

describe('findMissingBusinessDays', () => {
  const today = '2026-11-20' // 金曜

  it('記録が1件もなければ空', () => {
    expect(findMissingBusinessDays([], null, today)).toEqual([])
  })

  it('初回記録日〜昨日の営業日で記録がない日を新しい順で返す（土日は除く）', () => {
    // 11/13(金) 初回、11/16(月)〜11/19(木) のうち 11/17 だけ記録済み
    const result = findMissingBusinessDays(['2026-11-13', '2026-11-17'], '2026-11-13', today)
    expect(result).toEqual(['2026-11-19', '2026-11-18', '2026-11-16'])
  })

  it('今日は含めない', () => {
    expect(findMissingBusinessDays(['2026-11-19'], '2026-11-19', today)).toEqual([])
  })

  it('祝日は除く（11/3 文化の日）', () => {
    const recorded = ['2026-11-02', '2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19']
    expect(findMissingBusinessDays(recorded, '2026-11-02', today)).toEqual(['2026-11-04'])
  })

  it('年末年始（12/31〜1/3）は除く', () => {
    const result = findMissingBusinessDays(['2025-12-30'], '2025-12-30', '2026-01-06')
    expect(result).toEqual(['2026-01-05'])
  })

  it('遡るのは lookbackDays まで', () => {
    const result = findMissingBusinessDays([], '2026-01-01', today, 7)
    // 11/13〜11/19 の営業日
    expect(result).toEqual(['2026-11-19', '2026-11-18', '2026-11-17', '2026-11-16', '2026-11-13'])
  })
})

describe('validateBackfillDate', () => {
  const today = '2026-11-20'

  it('昨日以前の営業日は OK', () => {
    expect(validateBackfillDate('2026-11-19', today)).toBeNull()
  })

  it('形式不正・存在しない日付', () => {
    expect(validateBackfillDate('2026/11/19', today)).toBe('invalid')
    expect(validateBackfillDate(undefined, today)).toBe('invalid')
    expect(validateBackfillDate('2026-02-30', today)).toBe('invalid')
  })

  it('今日・未来は不可', () => {
    expect(validateBackfillDate('2026-11-20', today)).toBe('not-past')
    expect(validateBackfillDate('2026-11-24', today)).toBe('not-past')
  })

  it('2年より前は不可', () => {
    expect(validateBackfillDate('2024-11-01', today)).toBe('too-old')
  })

  it('休業日は不可', () => {
    expect(validateBackfillDate('2026-11-15', today)).toBe('holiday') // 日曜
    expect(validateBackfillDate('2026-11-03', today)).toBe('holiday') // 文化の日
  })
})

describe('hasHoldingsAt', () => {
  it('どれか1銘柄でも株を持っていれば true', () => {
    const stocks = [
      { positions: [], trades: [] },
      { positions: [pos({ purchaseDate: '2026-11-10' })], trades: [] },
    ]
    expect(hasHoldingsAt('2026-11-10', stocks)).toBe(true)
    expect(hasHoldingsAt('2026-11-09', stocks)).toBe(false)
  })

  it('売却済みの株も、売却前の日なら保有あり', () => {
    expect(hasHoldingsAt('2026-11-10', [{ positions: [], trades: [trade({})] }])).toBe(true)
    expect(hasHoldingsAt('2026-11-18', [{ positions: [], trades: [trade({})] }])).toBe(false)
  })
})

describe('toBackfillInputs', () => {
  it('Decimal 相当の値を数値にし、consumedLots が配列でなければ空にする', () => {
    const result = toBackfillInputs({
      positions: [{ id: 'p1', shares: 10, purchasePrice: '1500.5', purchaseDate: null, taxRate: '0', createdAt: new Date('2026-11-01T00:00:00Z') }],
      realizedTrades: [{ id: 't1', sellDate: '2026-11-18', costBasis: '1200', taxRate: '0.20315', consumedLots: null }],
    })
    expect(result.positions[0]).toMatchObject({ purchasePrice: 1500.5, purchaseDate: '', taxRate: 0, createdAt: '2026-11-01T00:00:00.000Z' })
    expect(result.trades[0]).toMatchObject({ costBasis: 1200, taxRate: 0.20315, consumedLots: [] })
  })
})
