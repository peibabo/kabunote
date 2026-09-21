import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockPriceHistory } from '@/hooks/stock/useStockPriceHistory'
import { clearSharedFetchCache } from '@/hooks/util/useSharedFetch'
import { APP_EVENTS, emitAppEvent } from '@/lib/appEvents'

const mockPatchSnapshotPrices = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  apiFetch: vi.fn(),
  patchSnapshotPrices: (...args: unknown[]) => mockPatchSnapshotPrices(...args),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const ITEM = (date: string, price: number) => ({
  snapshotId: `s-${date}`, date, price, shares: 100, value: 250000, cost: 240000,
})

function mockBulkFetch() {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      success: true,
      history: {
        'stock-a': [ITEM('2026-01-01', 2500)],
        'stock-b': [ITEM('2026-01-01', 1200)],
      },
    }),
  })
}

describe('useStockPriceHistory', () => {
  beforeEach(() => {
    clearSharedFetchCache()
    vi.clearAllMocks()
    localStorage.clear()
    mockPatchSnapshotPrices.mockResolvedValue({})
  })
  afterEach(() => vi.unstubAllGlobals())

  // これが本題：カード数ぶん飛んでいた price-history が1本になる
  it('複数銘柄の同時マウントでもHTTPリクエストは1本にまとまる', async () => {
    const fetchMock = mockBulkFetch()
    vi.stubGlobal('fetch', fetchMock)

    const a = renderHook(() => useStockPriceHistory('stock-a'))
    const b = renderHook(() => useStockPriceHistory('stock-b'))

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    await waitFor(() => expect(b.result.current.isLoading).toBe(false))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a.result.current.data[0].price).toBe(2500)
    expect(b.result.current.data[0].price).toBe(1200)
  })

  it('同じ銘柄の2枚目は取得済みキャッシュを使う', async () => {
    const fetchMock = mockBulkFetch()
    vi.stubGlobal('fetch', fetchMock)

    const first = renderHook(() => useStockPriceHistory('stock-a'))
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))

    const second = renderHook(() => useStockPriceHistory('stock-a'))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(second.result.current.data[0].price).toBe(2500)
  })

  it('stockId が無ければ取得せず空配列を返す', () => {
    const fetchMock = mockBulkFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStockPriceHistory(undefined))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.data).toEqual([])
    expect(result.current.isLoading).toBe(false)
  })

  it('スナップショット記録イベントで再取得する', async () => {
    vi.useFakeTimers()
    const fetchMock = mockBulkFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStockPriceHistory('stock-a'))
    await vi.waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)
      // 記録直後のDB遅延対策で500ms待ってから無効化する
      await vi.advanceTimersByTimeAsync(600)
    })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    vi.useRealTimers()
  })

  it('株価修正に成功すると履歴を再取得する', async () => {
    const fetchMock = mockBulkFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useStockPriceHistory('stock-a'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.updateSnapshotPrice('s-2026-01-01', 'stock-a', 2700)
    })

    expect(ok).toBe(true)
    expect(mockPatchSnapshotPrices).toHaveBeenCalledWith('s-2026-01-01', [{ stockId: 'stock-a', currentPrice: 2700 }])
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('株価修正に失敗したら error を出す', async () => {
    const fetchMock = mockBulkFetch()
    vi.stubGlobal('fetch', fetchMock)
    mockPatchSnapshotPrices.mockRejectedValue(new Error('修正に失敗しました'))

    const { result } = renderHook(() => useStockPriceHistory('stock-a'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.updateSnapshotPrice('s-2026-01-01', 'stock-a', 2700)
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('修正に失敗しました')
  })

  it('取得に失敗したら error を返す', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const { result } = renderHook(() => useStockPriceHistory('stock-a'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('株価履歴の取得に失敗しました')
    expect(result.current.data).toEqual([])
  })
})
