import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTabState, DEFAULT_TABS } from '@/hooks/tab/useTabState'

describe('useTabState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('デフォルトタブを返す', () => {
    const { result } = renderHook(() => useTabState('7203'))
    expect(result.current.activeTab).toBe('basic')
  })

  it('タブを変更できる', () => {
    const { result } = renderHook(() => useTabState('7203'))

    act(() => { result.current.setActiveTab('analysis') })
    expect(result.current.activeTab).toBe('analysis')
  })

  it('タブ定義を返す', () => {
    const { result } = renderHook(() => useTabState('7203'))
    expect(result.current.tabs).toEqual(DEFAULT_TABS)
  })

  it('localStorageから復元', () => {
    localStorage.setItem('kabunote-active-tab-7203', 'management')
    const { result } = renderHook(() => useTabState('7203'))
    expect(result.current.activeTab).toBe('management')
  })
})
