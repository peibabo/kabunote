import { describe, it, expect } from 'vitest'
import { isCompleted, getTodayDateString, calculateStreak } from '@/lib/checklistCalc'

describe('isCompleted', () => {
  it('空配列 → false', () => {
    expect(isCompleted([])).toBe(false)
  })

  it('[0] → true', () => {
    expect(isCompleted([0])).toBe(true)
  })

  it('[0, 2, 3] → true', () => {
    expect(isCompleted([0, 2, 3])).toBe(true)
  })
})

describe('getTodayDateString', () => {
  it('YYYY-MM-DD形式の文字列を返す', () => {
    const result = getTodayDateString()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('calculateStreak', () => {
  it('レコードなし → 全0', () => {
    const result = calculateStreak([], '2026-03-14')
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, totalCompletedDays: 0 })
  })

  it('今日のみ完了 → current=1', () => {
    const records = [{ date: '2026-03-14', checkedItems: [0] }]
    const result = calculateStreak(records, '2026-03-14')
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(1)
    expect(result.totalCompletedDays).toBe(1)
  })

  it('3日連続完了 → current=3', () => {
    const records = [
      { date: '2026-03-14', checkedItems: [0] },
      { date: '2026-03-13', checkedItems: [1, 2] },
      { date: '2026-03-12', checkedItems: [0, 1, 2, 3] },
    ]
    const result = calculateStreak(records, '2026-03-14')
    expect(result.currentStreak).toBe(3)
    expect(result.longestStreak).toBe(3)
    expect(result.totalCompletedDays).toBe(3)
  })

  it('途中欠け → currentは欠けた日以降のみ', () => {
    const records = [
      { date: '2026-03-14', checkedItems: [0] },
      { date: '2026-03-13', checkedItems: [1] },
      // 3/12 欠け
      { date: '2026-03-11', checkedItems: [0] },
      { date: '2026-03-10', checkedItems: [2] },
    ]
    const result = calculateStreak(records, '2026-03-14')
    expect(result.currentStreak).toBe(2)
    expect(result.longestStreak).toBe(2)
    expect(result.totalCompletedDays).toBe(4)
  })

  it('今日未完了・昨日まで連続 → currentは昨日からカウント', () => {
    const records = [
      { date: '2026-03-13', checkedItems: [0] },
      { date: '2026-03-12', checkedItems: [1] },
      { date: '2026-03-11', checkedItems: [2] },
    ]
    const result = calculateStreak(records, '2026-03-14')
    expect(result.currentStreak).toBe(3)
    expect(result.longestStreak).toBe(3)
  })

  it('longestStreakが過去にある場合', () => {
    const records = [
      { date: '2026-03-14', checkedItems: [0] },
      // 3/13 欠け
      { date: '2026-03-10', checkedItems: [0] },
      { date: '2026-03-09', checkedItems: [1] },
      { date: '2026-03-08', checkedItems: [2] },
      { date: '2026-03-07', checkedItems: [3] },
    ]
    const result = calculateStreak(records, '2026-03-14')
    expect(result.currentStreak).toBe(1)
    expect(result.longestStreak).toBe(4)
    expect(result.totalCompletedDays).toBe(5)
  })

  it('checkedItemsが空のレコードは完了日にカウントしない', () => {
    const records = [
      { date: '2026-03-14', checkedItems: [] },
      { date: '2026-03-13', checkedItems: [0] },
    ]
    const result = calculateStreak(records, '2026-03-14')
    expect(result.currentStreak).toBe(1) // 今日未完了なので昨日から
    expect(result.totalCompletedDays).toBe(1)
  })
})
