import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSnooze } from '@/hooks/useSnooze'

describe('useSnooze', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08T12:00:00Z'))
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('スヌーズを追加', () => {
    const { result } = renderHook(() => useSnooze())

    act(() => {
      result.current.snoozeAlert('7203', 'stop-loss', 15, {
        companyName: 'トヨタ',
        alertMessage: 'テスト',
        alertDetail: '詳細',
        currentPrice: 2500,
      })
    })

    expect(result.current.snoozedAlerts).toHaveLength(1)
    expect(result.current.isAlertSnoozed('7203', 'stop-loss')).toBe(true)
  })

  it('スヌーズを解除', () => {
    const { result } = renderHook(() => useSnooze())

    act(() => {
      result.current.snoozeAlert('7203', 'stop-loss', 15, {
        companyName: 'トヨタ',
        alertMessage: 'テスト',
        alertDetail: '詳細',
        currentPrice: 2500,
      })
    })

    act(() => {
      result.current.unsnoozeAlert('7203-stop-loss')
    })

    expect(result.current.snoozedAlerts).toHaveLength(0)
    expect(result.current.isAlertSnoozed('7203', 'stop-loss')).toBe(false)
  })

  it('スヌーズ判定: 存在しないアラートはfalse', () => {
    const { result } = renderHook(() => useSnooze())
    expect(result.current.isAlertSnoozed('9999', 'none')).toBe(false)
  })

  it('期限切れのスヌーズは除外される', () => {
    // 期限切れのデータをlocalStorageに入れておく
    const expiredAlert = {
      alertKey: '7203-stop-loss',
      symbol: '7203',
      alertType: 'stop-loss',
      snoozeUntil: Date.now() - 1000, // 1秒前に期限切れ
      snoozedAt: Date.now() - 60000,
      duration: 15,
      originalAlert: {
        companyName: 'トヨタ',
        alertMessage: 'テスト',
        alertDetail: '詳細',
        currentPrice: 2500,
      },
    }
    localStorage.setItem('kabunote-snoozed-alerts', JSON.stringify([expiredAlert]))

    const { result } = renderHook(() => useSnooze())
    expect(result.current.snoozedAlerts).toHaveLength(0)
  })
})
