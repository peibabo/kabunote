import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/util/useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('初期値を返す', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    expect(result.current[0]).toBe('default')
  })

  it('localStorageから読み込む', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'))
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))
    // useEffect後にlocalStorageの値を反映
    expect(result.current[0]).toBe('stored')
  })

  it('値を設定するとUIが即更新', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'))

    act(() => { result.current[1]('new-value') })
    expect(result.current[0]).toBe('new-value')
  })

  it('デバウンス後にlocalStorageに保存', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default', 300))

    act(() => { result.current[1]('saved-value') })
    // デバウンス前は未保存
    expect(localStorage.getItem('test-key')).toBeNull()

    act(() => { vi.advanceTimersByTime(300) })
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('saved-value'))
  })

  it('カスタムparserを使用', () => {
    localStorage.setItem('num-key', '42')
    const { result } = renderHook(() =>
      useLocalStorage('num-key', 0, 300, (v) => parseInt(v, 10), (v) => String(v))
    )
    expect(result.current[0]).toBe(42)
  })

  it('パースエラー時は初期値を使用', () => {
    localStorage.setItem('bad-key', '{{invalid json}')
    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })
})
