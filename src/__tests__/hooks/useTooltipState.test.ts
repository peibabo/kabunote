import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTooltipState } from '@/hooks/useTooltipState'

describe('useTooltipState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('初期状態はshow=false', () => {
    const { result } = renderHook(() => useTooltipState<string>())
    expect(result.current.tooltip.show).toBe(false)
    expect(result.current.tooltip.data).toBeNull()
  })

  it('showでツールチップが表示される', () => {
    const { result } = renderHook(() => useTooltipState<string>())

    act(() => {
      result.current.show({ x: 100, y: 200 }, 'test-data')
    })

    expect(result.current.tooltip.show).toBe(true)
    expect(result.current.tooltip.x).toBe(100)
    expect(result.current.tooltip.y).toBe(200)
    expect(result.current.tooltip.data).toBe('test-data')
  })

  it('hideでツールチップが非表示になる', () => {
    const { result } = renderHook(() => useTooltipState<string>())

    act(() => {
      result.current.show({ x: 100, y: 200 }, 'test-data')
    })
    expect(result.current.tooltip.show).toBe(true)

    act(() => {
      result.current.hide()
    })
    expect(result.current.tooltip.show).toBe(false)
  })

  it('scheduleHideで遅延後に非表示になる', () => {
    const { result } = renderHook(() => useTooltipState<string>(200))

    act(() => {
      result.current.show({ x: 100, y: 200 }, 'test-data')
    })
    expect(result.current.tooltip.show).toBe(true)

    act(() => {
      result.current.scheduleHide()
    })
    // まだ表示中
    expect(result.current.tooltip.show).toBe(true)

    // 200ms経過後に非表示
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current.tooltip.show).toBe(false)
  })

  it('handleTooltipEnterで予約された非表示がキャンセルされる', () => {
    const { result } = renderHook(() => useTooltipState<string>(200))

    act(() => {
      result.current.show({ x: 100, y: 200 }, 'test-data')
    })

    act(() => {
      result.current.scheduleHide()
    })

    act(() => {
      result.current.handleTooltipEnter()
    })

    // 200ms経過しても表示中
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(result.current.tooltip.show).toBe(true)
  })

  it('handleTooltipLeaveで即座に非表示になる', () => {
    const { result } = renderHook(() => useTooltipState<string>())

    act(() => {
      result.current.show({ x: 100, y: 200 }, 'test-data')
    })

    act(() => {
      result.current.handleTooltipLeave()
    })
    expect(result.current.tooltip.show).toBe(false)
  })

  it('オブジェクト型のdataも扱える', () => {
    interface TestData { id: number; name: string }
    const { result } = renderHook(() => useTooltipState<TestData>())

    act(() => {
      result.current.show({ x: 0, y: 0 }, { id: 1, name: 'test' })
    })

    expect(result.current.tooltip.data).toEqual({ id: 1, name: 'test' })
  })
})
