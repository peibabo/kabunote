import { describe, it, expect, vi, afterEach } from 'vitest'
import { isValidOnboardingEvent, trackOnboardingEvent } from '@/lib/onboardingEvents'

describe('isValidOnboardingEvent', () => {
  it('定義済みイベントと 0〜9 の整数ステップを受け付ける', () => {
    expect(isValidOnboardingEvent('shown', 0)).toBe(true)
    expect(isValidOnboardingEvent('get_started', 2)).toBe(true)
    expect(isValidOnboardingEvent('close', 9)).toBe(true)
  })

  it('不正な値を弾く', () => {
    expect(isValidOnboardingEvent('unknown', 0)).toBe(false)
    expect(isValidOnboardingEvent(undefined, 0)).toBe(false)
    expect(isValidOnboardingEvent('shown', 10)).toBe(false)
    expect(isValidOnboardingEvent('shown', -1)).toBe(false)
    expect(isValidOnboardingEvent('shown', '0')).toBe(false)
    expect(isValidOnboardingEvent('shown', NaN)).toBe(false)
  })
})

describe('trackOnboardingEvent', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keepalive 付きで POST する', () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    trackOnboardingEvent('later', 2)
    expect(fetchMock).toHaveBeenCalledWith('/api/onboarding/events', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ event: 'later', step: 2 }),
      keepalive: true,
    }))
  })

  it('送信失敗しても例外を投げない', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(() => trackOnboardingEvent('shown', 0)).not.toThrow()
    await Promise.resolve()
  })
})
