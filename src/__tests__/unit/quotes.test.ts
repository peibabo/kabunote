import { describe, it, expect, vi, afterEach } from 'vitest'
import { INVESTMENT_QUOTES, getTodayQuote } from '@/lib/quotes'

describe('quotes', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('INVESTMENT_QUOTES', () => {
    it('100件の格言が定義されている', () => {
      expect(INVESTMENT_QUOTES).toHaveLength(100)
    })

    it('全ての格言にtext, author, meaningが存在する', () => {
      for (const quote of INVESTMENT_QUOTES) {
        expect(quote.text).toBeTruthy()
        expect(quote.author).toBeTruthy()
        expect(quote.meaning).toBeTruthy()
      }
    })
  })

  describe('getTodayQuote', () => {
    it('有効な格言を返す', () => {
      const quote = getTodayQuote()
      expect(quote).toHaveProperty('text')
      expect(quote).toHaveProperty('author')
      expect(quote.text.length).toBeGreaterThan(0)
      expect(quote.author.length).toBeGreaterThan(0)
    })

    it('JST同日の朝と夜で同じ格言を返す', () => {
      vi.useFakeTimers()
      // JST 2026-03-13 09:00 = UTC 2026-03-13 00:00
      vi.setSystemTime(new Date('2026-03-13T00:00:00Z'))
      const quote1 = getTodayQuote()
      // JST 2026-03-13 23:59 = UTC 2026-03-13 14:59
      vi.setSystemTime(new Date('2026-03-13T14:59:59Z'))
      const quote2 = getTodayQuote()
      expect(quote1).toEqual(quote2)
    })

    it('JST日付が変わると異なる格言を返す', () => {
      vi.useFakeTimers()
      // JST 2026-03-13 23:59 = UTC 2026-03-13 14:59
      vi.setSystemTime(new Date('2026-03-13T14:59:59Z'))
      const quote1 = getTodayQuote()
      // JST 2026-03-14 00:00 = UTC 2026-03-13 15:00
      vi.setSystemTime(new Date('2026-03-13T15:00:00Z'))
      const quote2 = getTodayQuote()
      expect(quote1).not.toEqual(quote2)
    })
  })
})
