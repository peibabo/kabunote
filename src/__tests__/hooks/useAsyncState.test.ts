import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAsyncState } from '@/hooks/useAsyncState'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

describe('useAsyncState', () => {
  it('初期状態', () => {
    const { result } = renderHook(() => useAsyncState(false))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSaving).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('withLoading: 成功', async () => {
    const { result } = renderHook(() => useAsyncState(false))
    let ret: number | undefined

    await act(async () => {
      ret = await result.current.withLoading(async () => 42)
    })

    expect(ret).toBe(42)
    expect(result.current.isLoading).toBe(false)
  })

  it('withSaving: 成功', async () => {
    const { result } = renderHook(() => useAsyncState(false))
    let ret: string | undefined

    await act(async () => {
      ret = await result.current.withSaving(async () => 'saved')
    })

    expect(ret).toBe('saved')
    expect(result.current.isSaving).toBe(false)
  })

  it('withLoading: エラー時にerrorが設定される', async () => {
    const { result } = renderHook(() => useAsyncState(false))

    await act(async () => {
      await result.current.withLoading(async () => {
        throw new Error('テストエラー')
      })
    })

    expect(result.current.error).toBe('テストエラー')
    expect(result.current.isLoading).toBe(false)
  })

  it('initialLoading=trueの場合', () => {
    const { result } = renderHook(() => useAsyncState(true))
    expect(result.current.isLoading).toBe(true)
  })
})
