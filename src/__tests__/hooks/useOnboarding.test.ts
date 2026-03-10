import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnboarding } from '@/hooks/useOnboarding'

function mockFetchOnboarding(completed: boolean) {
  vi.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ completed }), { status: 200 })
  )
}

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('初回はオンボーディングを表示する', async () => {
    mockFetchOnboarding(false)
    const { result } = renderHook(() => useOnboarding())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.showOnboarding).toBe(true)
  })

  it('完了済みの場合はオンボーディングを表示しない', async () => {
    mockFetchOnboarding(true)
    const { result } = renderHook(() => useOnboarding())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.showOnboarding).toBe(false)
  })

  it('API読み込み中はisLoading=true, showOnboarding=false', () => {
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useOnboarding())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.showOnboarding).toBe(false)
  })

  it('completeOnboarding()で完了フラグをセットしAPIにPOST', async () => {
    mockFetchOnboarding(false)
    const { result } = renderHook(() => useOnboarding())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.showOnboarding).toBe(true)

    // POST用のモックに切り替え
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ completed: true }), { status: 200 })
    )

    act(() => { result.current.completeOnboarding() })
    expect(result.current.showOnboarding).toBe(false)

    // POSTが呼ばれたか確認
    expect(global.fetch).toHaveBeenCalledWith('/api/onboarding', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ completed: true }),
    }))
  })

  it('resetOnboarding()でフラグをリセットしAPIにPOST', async () => {
    mockFetchOnboarding(true)
    const { result } = renderHook(() => useOnboarding())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.showOnboarding).toBe(false)

    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ completed: false }), { status: 200 })
    )

    act(() => { result.current.resetOnboarding() })
    expect(result.current.showOnboarding).toBe(true)

    expect(global.fetch).toHaveBeenCalledWith('/api/onboarding', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ completed: false }),
    }))
  })

  it('APIエラー時はウィザード非表示のまま', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network error'))
    const { result } = renderHook(() => useOnboarding())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.showOnboarding).toBe(false)
  })
})
