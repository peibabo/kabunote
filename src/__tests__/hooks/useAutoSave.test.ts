import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '@/hooks/useAutoSave'

describe('useAutoSave', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('markDirty後にonSaveが呼ばれる', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave({ value, delay: 300, isLoading: false, onSave }),
      { initialProps: { value: 'initial' } }
    )

    act(() => { result.current.markDirty() })
    rerender({ value: 'updated' })

    act(() => { vi.advanceTimersByTime(300) })
    expect(onSave).toHaveBeenCalledWith('updated')
  })

  it('markDirtyなしではonSaveが呼ばれない', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ value }) => useAutoSave({ value, delay: 300, isLoading: false, onSave }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    act(() => { vi.advanceTimersByTime(300) })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('isLoading中はonSaveがスキップされる', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ value, isLoading }) => useAutoSave({ value, delay: 300, isLoading, onSave }),
      { initialProps: { value: 'initial', isLoading: true } }
    )

    act(() => { result.current.markDirty() })
    rerender({ value: 'updated', isLoading: true })

    act(() => { vi.advanceTimersByTime(300) })
    expect(onSave).not.toHaveBeenCalled()
  })
})
