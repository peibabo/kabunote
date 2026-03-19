import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoSave } from '@/hooks/util/useAutoSave'

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

  it('アンマウント時にペンディング保存がフラッシュされる', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useAutoSave({ value, delay: 300, isLoading: false, onSave }),
      { initialProps: { value: 'initial' } }
    )

    act(() => { result.current.markDirty() })
    rerender({ value: 'final-value' })

    // デバウンス発火前にアンマウント
    unmount()
    expect(onSave).toHaveBeenCalledWith('final-value')
  })

  it('flush()が即座に保存する', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave({ value, delay: 300, isLoading: false, onSave }),
      { initialProps: { value: 'initial' } }
    )

    act(() => { result.current.markDirty() })
    rerender({ value: 'flushed-value' })

    // デバウンス待たずにflush
    act(() => { result.current.flush() })
    expect(onSave).toHaveBeenCalledWith('flushed-value')
  })

  it('markDirtyなしでflush()しても保存されない', () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave({ value, delay: 300, isLoading: false, onSave }),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'new-value' })
    act(() => { result.current.flush() })
    expect(onSave).not.toHaveBeenCalled()
  })

  it('保存中に新しい値が来た場合、完了後に最新値で再保存される', async () => {
    let resolveFirst: () => void
    const firstSave = new Promise<void>(r => { resolveFirst = r })
    const onSave = vi.fn()
      .mockReturnValueOnce(firstSave)
      .mockResolvedValue(undefined)

    const { result, rerender } = renderHook(
      ({ value }) => useAutoSave({ value, delay: 300, isLoading: false, onSave }),
      { initialProps: { value: 'initial' } }
    )

    // 最初の保存をトリガー
    act(() => { result.current.markDirty() })
    rerender({ value: 'first' })
    act(() => { vi.advanceTimersByTime(300) })
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('first')

    // 保存中に新しい入力
    act(() => { result.current.markDirty() })
    rerender({ value: 'second' })
    act(() => { vi.advanceTimersByTime(300) })
    // まだ最初の保存中なのでonSaveは1回のまま
    expect(onSave).toHaveBeenCalledTimes(1)

    // 最初の保存が完了 → 最新値で再保存される
    await act(async () => { resolveFirst!() })
    expect(onSave).toHaveBeenCalledTimes(2)
    expect(onSave).toHaveBeenLastCalledWith('second')
  })
})
