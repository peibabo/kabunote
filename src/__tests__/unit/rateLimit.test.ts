import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  resetRateLimitStore,
  rateLimitHeaders,
  WRITE_LIMIT,
  AUTH_LIMIT,
  FEEDBACK_LIMIT,
} from '@/lib/rateLimit'

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimitStore()
    vi.restoreAllMocks()
  })

  describe('checkRateLimit', () => {
    it('デフォルト設定で最初のリクエストを許可する', () => {
      const result = checkRateLimit('user:test-1')
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(59) // デフォルト60 - 1
    })

    it('制限内のリクエストを許可する', () => {
      const config = { maxRequests: 3, windowMs: 60000 }
      expect(checkRateLimit('user:test-2', config).allowed).toBe(true)
      expect(checkRateLimit('user:test-2', config).allowed).toBe(true)
      expect(checkRateLimit('user:test-2', config).allowed).toBe(true)
    })

    it('制限超過時にリクエストを拒否する', () => {
      const config = { maxRequests: 2, windowMs: 60000 }
      checkRateLimit('user:test-3', config)
      checkRateLimit('user:test-3', config)
      const result = checkRateLimit('user:test-3', config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetInSeconds).toBeGreaterThan(0)
    })

    it('異なるキーは独立してカウントする', () => {
      const config = { maxRequests: 1, windowMs: 60000 }
      expect(checkRateLimit('user:a', config).allowed).toBe(true)
      expect(checkRateLimit('user:b', config).allowed).toBe(true)
      expect(checkRateLimit('user:a', config).allowed).toBe(false)
      expect(checkRateLimit('user:b', config).allowed).toBe(false)
    })

    it('ウィンドウ期限切れ後にリクエストを再び許可する', () => {
      const config = { maxRequests: 1, windowMs: 1000 }
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)
      checkRateLimit('user:test-4', config)

      // ウィンドウ期限切れ
      vi.spyOn(Date, 'now').mockReturnValue(now + 1001)
      const result = checkRateLimit('user:test-4', config)
      expect(result.allowed).toBe(true)
    })

    it('remaining が正しくデクリメントされる', () => {
      const config = { maxRequests: 5, windowMs: 60000 }
      expect(checkRateLimit('user:test-5', config).remaining).toBe(4)
      expect(checkRateLimit('user:test-5', config).remaining).toBe(3)
      expect(checkRateLimit('user:test-5', config).remaining).toBe(2)
      expect(checkRateLimit('user:test-5', config).remaining).toBe(1)
      expect(checkRateLimit('user:test-5', config).remaining).toBe(0)
    })
  })

  describe('rateLimitHeaders', () => {
    it('正しいヘッダーを生成する', () => {
      const result = { allowed: true, remaining: 5, resetInSeconds: 60 }
      const config = { maxRequests: 10, windowMs: 60000 }
      const headers = rateLimitHeaders(result, config)
      expect(headers['X-RateLimit-Limit']).toBe('10')
      expect(headers['X-RateLimit-Remaining']).toBe('5')
      expect(headers['X-RateLimit-Reset']).toBe('60')
    })
  })

  describe('プリセット設定', () => {
    it('WRITE_LIMIT: 1分30リクエスト', () => {
      expect(WRITE_LIMIT.maxRequests).toBe(30)
      expect(WRITE_LIMIT.windowMs).toBe(60000)
    })

    it('AUTH_LIMIT: 1分10リクエスト', () => {
      expect(AUTH_LIMIT.maxRequests).toBe(10)
      expect(AUTH_LIMIT.windowMs).toBe(60000)
    })

    it('FEEDBACK_LIMIT: 1時間5リクエスト', () => {
      expect(FEEDBACK_LIMIT.maxRequests).toBe(5)
      expect(FEEDBACK_LIMIT.windowMs).toBe(3600000)
    })
  })

  describe('クリーンアップ', () => {
    it('古いエントリがクリーンアップされてもエラーにならない', () => {
      const now = Date.now()
      vi.spyOn(Date, 'now').mockReturnValue(now)
      checkRateLimit('user:old', { maxRequests: 10, windowMs: 1000 })

      // 11分後（クリーンアップ閾値の10分を超える）
      vi.spyOn(Date, 'now').mockReturnValue(now + 11 * 60 * 1000)
      // クリーンアップが走っても正常に動作する
      const result = checkRateLimit('user:new', { maxRequests: 10, windowMs: 1000 })
      expect(result.allowed).toBe(true)
    })
  })
})
