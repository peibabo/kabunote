import { describe, it, expect } from 'vitest'
import { calcFirstSteps } from '@/lib/firstStepsCalc'
import type { Position } from '@/types/positions'

const stock = (symbol: string, memo = '', positions: Position[] = []) => ({ symbol, memo, positions })
const position = { id: 'p1', shares: 100, avgPrice: 1000 } as unknown as Position

const doneMap = (stocks: ReturnType<typeof stock>[], hasCalendarData = false) =>
  Object.fromEntries(calcFirstSteps(stocks, hasCalendarData).steps.map(s => [s.id, s.done]))

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
    const result = calcFirstSteps([stock('7203', 'メモ', [position]), stock('6758')], false)
    expect(result.isAllDone).toBe(true)
    expect(result.nextStepId).toBeNull()
  })

  it('案内先は表示順の先頭銘柄', () => {
    expect(calcFirstSteps([stock('6758'), stock('7203')], false).targetSymbol).toBe('6758')
  })
})
