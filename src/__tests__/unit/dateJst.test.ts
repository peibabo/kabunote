import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTodayJST, getJSTDateDaysAgo, formatDateJST, dateStrToUTCMidnight, getJSTHour, isBeforeTodayJST } from '@/lib/dateJst'

describe('dateJst', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getTodayJST', () => {
    it('UTC 14:59 (= JST 23:59) は当日を返す', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T14:59:59.999Z'))
      expect(getTodayJST()).toBe('2026-03-21')
    })

    it('UTC 15:00 (= JST 翌日0:00) は翌日を返す', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T15:00:00.000Z'))
      expect(getTodayJST()).toBe('2026-03-22')
    })

    it('UTC 0:00 (= JST 9:00) は同日を返す', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T00:00:00.000Z'))
      expect(getTodayJST()).toBe('2026-03-21')
    })
  })

  describe('isBeforeTodayJST', () => {
    it('昨日以前は true、当日・未来は false', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T16:00:00.000Z')) // JST 3/22
      expect(isBeforeTodayJST('2026-03-21')).toBe(true)  // 昨日
      expect(isBeforeTodayJST('2026-03-22')).toBe(false) // 当日
      expect(isBeforeTodayJST('2026-03-23')).toBe(false) // 未来
    })
  })

  describe('getJSTDateDaysAgo', () => {
    it('0日前はgetTodayJSTと一致', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T16:00:00.000Z')) // JST 3/22 1:00
      expect(getJSTDateDaysAgo(0)).toBe(getTodayJST())
    })

    it('1日前を正しく返す', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-22T00:00:00.000Z')) // JST 3/22 9:00
      expect(getJSTDateDaysAgo(1)).toBe('2026-03-21')
    })

    it('月をまたぐケース', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-31T16:00:00.000Z')) // JST 4/1 1:00
      expect(getJSTDateDaysAgo(0)).toBe('2026-04-01')
      expect(getJSTDateDaysAgo(1)).toBe('2026-03-31')
    })
  })

  describe('formatDateJST', () => {
    it('UTC midnightのDateをJST基準で同日に変換', () => {
      expect(formatDateJST(new Date('2026-03-21T00:00:00.000Z'))).toBe('2026-03-21')
    })

    it('UTC 15:00のDateをJST翌日に変換', () => {
      expect(formatDateJST(new Date('2026-03-21T15:00:00.000Z'))).toBe('2026-03-22')
    })

    it('UTC 14:59のDateをJST当日に変換', () => {
      expect(formatDateJST(new Date('2026-03-21T14:59:59.000Z'))).toBe('2026-03-21')
    })

    it('年末年始のケース', () => {
      expect(formatDateJST(new Date('2025-12-31T15:00:00.000Z'))).toBe('2026-01-01')
    })
  })

  describe('dateStrToUTCMidnight', () => {
    it('YYYY-MM-DD文字列をUTC midnightに変換', () => {
      const result = dateStrToUTCMidnight('2026-03-21')
      expect(result.toISOString()).toBe('2026-03-21T00:00:00.000Z')
    })
  })

  describe('getJSTHour', () => {
    it('UTC 0:00 はJST 9時', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T00:00:00.000Z'))
      expect(getJSTHour()).toBe(9)
    })

    it('UTC 15:00 はJST 0時', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T15:00:00.000Z'))
      expect(getJSTHour()).toBe(0)
    })

    it('UTC 6:00 はJST 15時', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-21T06:00:00.000Z'))
      expect(getJSTHour()).toBe(15)
    })
  })
})
