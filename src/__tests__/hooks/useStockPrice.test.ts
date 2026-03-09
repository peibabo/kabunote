import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockPrice } from '@/hooks/useStockPrice'

const mockApiFetch = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

describe('useStockPrice', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
    mockApiFetch.mockResolvedValue({
      currentPrice: 2500,
      targetPrice: 3000,
      stopLossPrice: 2200,
    })
  })

  it('APIから読み込み', async () => {
    const { result } = renderHook(() => useStockPrice('stock-7203'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.currentPrice).toBe('2500')
    expect(result.current.targetPrice).toBe('3000')
    expect(result.current.stopLoss).toBe('2200')
  })

  it('initialDataがある場合APIを呼ばない', () => {
    mockApiFetch.mockReset()
    const { result } = renderHook(() =>
      useStockPrice('stock-7203', {
        initialData: { currentPrice: 1500, targetPrice: 1600, stopLossPrice: 1400 },
      })
    )

    expect(result.current.currentPrice).toBe('1500')
    expect(result.current.isLoading).toBe(false)
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('setCurrentPriceで値を更新', () => {
    const { result } = renderHook(() =>
      useStockPrice('stock-7203', {
        initialData: { currentPrice: 1500, targetPrice: null, stopLossPrice: null },
      })
    )

    act(() => { result.current.setCurrentPrice('2000') })
    expect(result.current.currentPrice).toBe('2000')
  })

  it('APIエラー時', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useStockPrice('stock-7203'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.currentPrice).toBe('')
  })
})
