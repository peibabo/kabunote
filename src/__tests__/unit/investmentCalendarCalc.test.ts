import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateBusinessDaysBefore,
  calculateRightsLastDate,
  formatDateString,
  calculateFullDateFromMonthDay,
} from '@/lib/investmentCalendarCalc'

describe('calculateBusinessDaysBefore', () => {
  it('土日をスキップして営業日を計算（月曜から2日前は前週木曜）', () => {
    const date = new Date(2026, 2, 9) // 月曜日
    const result = calculateBusinessDaysBefore(date, 2)
    expect(result.getDay()).toBe(4) // 木曜日
    expect(result.getDate()).toBe(5)
  })

  it('0営業日前は同日', () => {
    const date = new Date(2026, 2, 9)
    const result = calculateBusinessDaysBefore(date, 0)
    expect(result.getDate()).toBe(date.getDate())
  })

  it('金曜から3営業日前は火曜', () => {
    const date = new Date(2026, 2, 13)
    const result = calculateBusinessDaysBefore(date, 3)
    expect(result.getDay()).toBe(2) // 火曜日
  })

  it('1営業日前で土日を跨ぐ', () => {
    // 月曜の1営業日前は前週金曜
    const date = new Date(2026, 2, 9) // 月曜
    const result = calculateBusinessDaysBefore(date, 1)
    expect(result.getDay()).toBe(5) // 金曜日
  })
})

describe('calculateRightsLastDate', () => {
  it('権利確定日の2営業日前を返す', () => {
    const confirmationDate = new Date(2026, 2, 31) // 火曜
    const result = calculateRightsLastDate(confirmationDate)
    expect(result.getDay()).toBe(5) // 金曜日
    expect(result.getDate()).toBe(27)
  })
})

describe('formatDateString', () => {
  it('ISO形式の日付部分を返す', () => {
    const date = new Date('2026-03-08T12:00:00Z')
    expect(formatDateString(date)).toBe('2026-03-08')
  })
})

describe('calculateFullDateFromMonthDay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('未来の月日は今年の日付を返す', () => {
    const result = calculateFullDateFromMonthDay(6, 30)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(5)
  })

  it('過去の月日はrecurring=trueで翌年', () => {
    const result = calculateFullDateFromMonthDay(1, 15, true)
    expect(result.getFullYear()).toBe(2027)
  })

  it('過去の月日はrecurring=falseで今年', () => {
    const result = calculateFullDateFromMonthDay(1, 15, false)
    expect(result.getFullYear()).toBe(2026)
  })
})
