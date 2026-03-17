import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAccordionState } from '@/hooks/util/useAccordionState'

// playSound をモック
vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
}))

describe('useAccordionState', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('デフォルトではfalse', () => {
    const { result } = renderHook(() => useAccordionState())
    expect(result.current.isExpanded).toBe(false)
  })

  it('defaultExpanded=trueで初期値がtrue', () => {
    const { result } = renderHook(() => useAccordionState({ defaultExpanded: true }))
    expect(result.current.isExpanded).toBe(true)
  })

  it('toggleで開閉が切り替わる', () => {
    const { result } = renderHook(() => useAccordionState())
    expect(result.current.isExpanded).toBe(false)

    act(() => { result.current.toggle() })
    expect(result.current.isExpanded).toBe(true)

    act(() => { result.current.toggle() })
    expect(result.current.isExpanded).toBe(false)
  })

  it('toggleでplaySoundが呼ばれる', async () => {
    const { playSound } = await import('@/lib/sound')
    const { result } = renderHook(() => useAccordionState())

    act(() => { result.current.toggle() })
    expect(playSound).toHaveBeenCalledWith('accordionOpen')

    act(() => { result.current.toggle() })
    expect(playSound).toHaveBeenCalledWith('accordionClose')
  })

  it('storageKeyが指定されている場合、localStorageに保存される', () => {
    const key = 'test-accordion-key'
    const { result } = renderHook(() => useAccordionState({ storageKey: key }))

    act(() => { result.current.toggle() })
    expect(localStorage.getItem(key)).toBe('true')

    act(() => { result.current.toggle() })
    expect(localStorage.getItem(key)).toBe('false')
  })

  it('storageKeyが指定されている場合、localStorageから初期値を復元する', () => {
    const key = 'test-accordion-key'
    localStorage.setItem(key, 'true')

    const { result } = renderHook(() => useAccordionState({ storageKey: key }))
    expect(result.current.isExpanded).toBe(true)
  })

  it('storageKeyのlocalStorage値がdefaultExpandedより優先される', () => {
    const key = 'test-accordion-key'
    localStorage.setItem(key, 'false')

    const { result } = renderHook(() =>
      useAccordionState({ storageKey: key, defaultExpanded: true })
    )
    expect(result.current.isExpanded).toBe(false)
  })
})
