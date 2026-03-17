import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockPosition } from '@/hooks/stock/useStockPosition'

const mockApiFetch = vi.fn()
const mockApiPost = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const mockPositions = [
  {
    id: 'pos-1',
    shares: 100,
    purchasePrice: 2400,
    purchaseDate: '2024-03-01',
    memo: '',
    createdAt: '2024-03-01T00:00:00Z',
  },
]

describe('useStockPosition', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
    mockApiPost.mockReset()
    mockApiFetch.mockResolvedValue(mockPositions)
    mockApiPost.mockResolvedValue(mockPositions[0])
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockPositions[0] }),
    }))
  })

  it('APIから読み込み', async () => {
    const { result } = renderHook(() => useStockPosition('stock-7203'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.positions).toHaveLength(1)
    expect(result.current.positions[0].shares).toBe(100)
  })

  it('initialDataがある場合APIを呼ばない', () => {
    mockApiFetch.mockReset()
    const { result } = renderHook(() =>
      useStockPosition('stock-7203', { initialData: mockPositions as never })
    )

    expect(result.current.positions).toHaveLength(1)
    expect(result.current.isLoading).toBe(false)
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('addPosition: ポジションを追加', async () => {
    const { result } = renderHook(() =>
      useStockPosition('stock-7203', { initialData: [] })
    )

    await act(async () => {
      await result.current.addPosition({
        shares: 200,
        purchasePrice: 2500,
        purchaseDate: '2024-06-01',
      })
    })

    expect(mockApiPost).toHaveBeenCalled()
  })

  it('deletePosition: ポジションを削除', async () => {
    const { result } = renderHook(() =>
      useStockPosition('stock-7203', { initialData: mockPositions as never })
    )

    await act(async () => {
      await result.current.deletePosition('pos-1')
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stocks/stock-7203/position/pos-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})
