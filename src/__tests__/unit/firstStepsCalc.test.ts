import { describe, it, expect } from 'vitest'
import { calcFirstSteps } from '@/lib/firstStepsCalc'
import type { Position } from '@/types/positions'

const stock = (symbol: string, memo = '', positions: Position[] = [], currentPrice: number | null = null) =>
  ({ symbol, memo, positions, currentPrice })
const position = { id: 'p1', shares: 100, avgPrice: 1000 } as unknown as Position
const soldOut = { id: 'p2', shares: 0, avgPrice: 1000 } as unknown as Position

const doneMap = (stocks: ReturnType<typeof stock>[], hasCalendarData = false, hasSnapshot = false) =>
  Object.fromEntries(calcFirstSteps(stocks, hasCalendarData, hasSnapshot).steps.map(s => [s.id, s.done]))

describe('calcFirstSteps', () => {
  it('銘柄0件: 何も完了しておらず案内先もない', () => {
    const result = calcFirstSteps([], false)
    expect(result.completedCount).toBe(0)
    expect(result.targetSymbol).toBeNull()
    expect(result.nextStepId).toBe('add-stock')
  })

  it('銘柄1件だけ追加: 1/4完了で次はメモ', () => {
    const result = calcFirstSteps([stock('7203')], false)
    expect(result.completedCount).toBe(1)
    expect(result.totalCount).toBe(4)
    expect(result.nextStepId).toBe('write-memo')
    expect(result.targetSymbol).toBe('7203')
    expect(result.isAllDone).toBe(false)
  })

  it('空白だけのメモは未完了扱い', () => {
    expect(doneMap([stock('7203', '  \n ')])['write-memo']).toBe(false)
    expect(doneMap([stock('7203', 'トヨタは円安メリット')])['write-memo']).toBe(true)
  })

  it('保有ポジションがあれば保有ステップ完了', () => {
    expect(doneMap([stock('7203', '', [position])])['register-position']).toBe(true)
  })

  it('未保有でも決算日などの予定登録があれば保有ステップ完了', () => {
    expect(doneMap([stock('7203')], true)['register-position']).toBe(true)
    expect(doneMap([stock('7203')], false)['register-position']).toBe(false)
  })

  it('2銘柄以上で「もう1つ追加」完了', () => {
    expect(doneMap([stock('7203')])['add-second-stock']).toBe(false)
    expect(doneMap([stock('7203'), stock('6758')])['add-second-stock']).toBe(true)
  })

  it('全ステップ完了で isAllDone かつ nextStepId は null', () => {
    const result = calcFirstSteps([stock('7203', 'メモ', [position], 3000), stock('6758')], false, true)
    expect(result.isAllDone).toBe(true)
    expect(result.nextStepId).toBeNull()
  })

  describe('今日の株価を入れて記録（record-price）', () => {
    it('保有株がなければステップ自体を出さない（未保有・決算日だけの人は4ステップ）', () => {
      const result = calcFirstSteps([stock('7203', 'メモ'), stock('6758')], true)
      expect(result.steps.map(s => s.id)).not.toContain('record-price')
      expect(result.totalCount).toBe(4)
      expect(result.isAllDone).toBe(true)
    })

    it('株数0のポジションしかない銘柄は保有扱いしない', () => {
      const result = calcFirstSteps([stock('7203', '', [soldOut])], false)
      expect(result.steps.map(s => s.id)).not.toContain('record-price')
    })

    it('保有株があれば保有登録の次に追加され、記録がなければ未完了', () => {
      const result = calcFirstSteps([stock('7203', 'メモ', [position])], false)
      expect(result.steps.map(s => s.id)).toEqual([
        'add-stock', 'write-memo', 'register-position', 'record-price', 'add-second-stock',
      ])
      expect(result.totalCount).toBe(5)
      expect(result.nextStepId).toBe('record-price')
    })

    it('記録（スナップショット）が1件でもあれば完了', () => {
      expect(doneMap([stock('7203', '', [position], 3000)], false, true)['record-price']).toBe(true)
      expect(doneMap([stock('7203', '', [position], 3000)], false, false)['record-price']).toBe(false)
    })

    it('株価未入力の保有銘柄を priceInputSymbol に返し、株価がどれも無ければ記録不可', () => {
      const result = calcFirstSteps([stock('6758'), stock('7203', '', [position])], false)
      expect(result.priceInputSymbol).toBe('7203')
      expect(result.canRecord).toBe(false)
    })

    it('一部の保有銘柄に株価があれば記録可能、残りの未入力銘柄も案内する', () => {
      const result = calcFirstSteps([
        stock('7203', '', [position], 3000),
        stock('6758', '', [position], 0),
      ], false)
      expect(result.canRecord).toBe(true)
      expect(result.priceInputSymbol).toBe('6758')
    })

    it('全保有銘柄に株価があれば priceInputSymbol は null', () => {
      const result = calcFirstSteps([stock('7203', '', [position], 3000)], false)
      expect(result.priceInputSymbol).toBeNull()
      expect(result.canRecord).toBe(true)
    })
  })

  it('案内先は表示順の先頭銘柄', () => {
    expect(calcFirstSteps([stock('6758'), stock('7203')], false).targetSymbol).toBe('6758')
  })
})
