import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockPrice } from '@/hooks/stock/useStockPrice'

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
      per: 12.5,
      pbr: 0.8,
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
    expect(result.current.per).toBe('12.5')
    expect(result.current.pbr).toBe('0.8')
  })

  it('initialDataがある場合APIを呼ばない', () => {
    mockApiFetch.mockReset()
    const { result } = renderHook(() =>
      useStockPrice('stock-7203', {
        initialData: { currentPrice: 1500, targetPrice: 1600, stopLossPrice: 1400, per: 15.2, pbr: 1.1 },
      })
    )

    expect(result.current.currentPrice).toBe('1500')
    expect(result.current.per).toBe('15.2')
    expect(result.current.pbr).toBe('1.1')
    expect(result.current.isLoading).toBe(false)
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('setCurrentPriceで値を更新', () => {
    const { result } = renderHook(() =>
      useStockPrice('stock-7203', {
        initialData: { currentPrice: 1500, targetPrice: null, stopLossPrice: null, per: null, pbr: null },
      })
    )

    act(() => { result.current.setCurrentPrice('2000') })
    expect(result.current.currentPrice).toBe('2000')
  })

  it('setPer/setPbrで値を更新', () => {
    const { result } = renderHook(() =>
      useStockPrice('stock-7203', {
        initialData: { currentPrice: 1500, targetPrice: null, stopLossPrice: null, per: null, pbr: null },
      })
    )

    act(() => { result.current.setPer('18.5') })
    expect(result.current.per).toBe('18.5')

    act(() => { result.current.setPbr('1.2') })
    expect(result.current.pbr).toBe('1.2')
  })

  it('APIエラー時', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useStockPrice('stock-7203'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.currentPrice).toBe('')
    expect(result.current.per).toBe('')
    expect(result.current.pbr).toBe('')
  })
})
