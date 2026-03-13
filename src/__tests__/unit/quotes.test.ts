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

    it('全ての格言にtextとauthorが存在する', () => {
      for (const quote of INVESTMENT_QUOTES) {
        expect(quote.text).toBeTruthy()
        expect(quote.author).toBeTruthy()
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

    it('同じ日には同じ格言を返す', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-13T09:00:00'))
      const quote1 = getTodayQuote()
      vi.setSystemTime(new Date('2026-03-13T23:59:59'))
      const quote2 = getTodayQuote()
      expect(quote1).toEqual(quote2)
    })

    it('異なる日には異なる格言を返す', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-13T12:00:00'))
      const quote1 = getTodayQuote()
      vi.setSystemTime(new Date('2026-03-14T12:00:00'))
      const quote2 = getTodayQuote()
      expect(quote1).not.toEqual(quote2)
    })
  })
})
