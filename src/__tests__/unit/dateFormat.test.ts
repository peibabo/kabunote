import { describe, it, expect } from 'vitest'
import { formatDateString, formatMonthDay } from '@/lib/dateFormat'

describe('formatDateString', () => {
  it('ISO形式の日付部分を返す', () => {
    const date = new Date('2026-03-08T12:00:00Z')
    expect(formatDateString(date)).toBe('2026-03-08')
  })

  it('1桁の月日も0埋めされる', () => {
    const date = new Date('2026-01-05T00:00:00Z')
    expect(formatDateString(date)).toBe('2026-01-05')
  })
})

describe('formatMonthDay', () => {
  it('YYYY-MM-DD形式をM/D形式に変換', () => {
    expect(formatMonthDay('2026-03-08')).toBe('3/8')
  })

  it('2桁月日も正しく変換', () => {
    expect(formatMonthDay('2026-12-25')).toBe('12/25')
  })

  it('空文字列の場合は"-"を返す', () => {
    expect(formatMonthDay('')).toBe('-')
  })

  it('1月1日を正しく変換', () => {
    expect(formatMonthDay('2026-01-01')).toBe('1/1')
  })
})
