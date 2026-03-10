import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnboarding } from '@/hooks/useOnboarding'
import { STORAGE_KEYS } from '@/lib/storageKeys'

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('初回はオンボーディングを表示する', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.showOnboarding).toBe(true)
  })

  it('完了後はオンボーディングを表示しない', () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(true))
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.showOnboarding).toBe(false)
  })

  it('completeOnboarding()で完了フラグをセット', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.showOnboarding).toBe(true)

    act(() => { result.current.completeOnboarding() })
    expect(result.current.showOnboarding).toBe(false)
  })

  it('resetOnboarding()でフラグをリセット', () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(true))
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.showOnboarding).toBe(false)

    act(() => { result.current.resetOnboarding() })
    expect(result.current.showOnboarding).toBe(true)
  })
})
