import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockData } from '@/hooks/stock/useStockData'
import { APP_EVENTS, emitAppEvent } from '@/lib/appEvents'

const mockApiFetch = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/lib/supabase-client', () => ({
  createClient: () => ({
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}))

const STOCK_ID = 'clz1a2b3c4d5e6f7g8h9i0jk'

const LIST_RESPONSE = [{
  id: STOCK_ID,
  symbol: '7203',
  name: 'トヨタ自動車',
  positions: [],
  realizedTrades: [{ id: 't1', symbol: '7203', sellDate: '2024-05-10' }],
  events: [],
  tags: [],
  newsItems: [],
}]

const FRESH_TRADES = [
  { id: 't2', symbol: '7203', sellDate: '2024-06-20' },
  { id: 't1', symbol: '7203', sellDate: '2024-05-10' },
]

/** `/api/stocks/list` は素の fetch、確定損益の再取得は apiFetch 経由 */
function stubListFetch() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: LIST_RESPONSE, portfolioSnapshot: null }),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useStockData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiFetch.mockReset()
    mockApiFetch.mockResolvedValue(FRESH_TRADES)
  })

  it('一括取得の結果を確定損益込みで保持する', async () => {
    stubListFetch()
    const { result } = renderHook(() => useStockData())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.stockDataMap.get('7203')?.realizedTrades).toHaveLength(1)
  })

  // 銘柄カードは realizedTrades を initialData として使うため、
  // ここを同期しないとタブ切り替えでの再マウント時に古い履歴が復活する
  it('確定損益更新イベントで当該銘柄の履歴を再取得してキャッシュを更新する', async () => {
    stubListFetch()
    const { result } = renderHook(() => useStockData())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { symbol: '7203', stockId: 'stock-7203' })
    })

    await waitFor(() =>
      expect(result.current.stockDataMap.get('7203')?.realizedTrades).toHaveLength(2)
    )
    expect(mockApiFetch).toHaveBeenCalledWith('/api/stocks/stock-7203/position/sell')
  })

  it('symbol の無い detail でも stockId から銘柄を解決する（cuid / stock-接頭辞の両形式）', async () => {
    stubListFetch()
    const { result } = renderHook(() => useStockData())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // ポートフォリオ画面由来：cuid のみ
    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId: STOCK_ID })
    })
    await waitFor(() =>
      expect(result.current.stockDataMap.get('7203')?.realizedTrades).toHaveLength(2)
    )
    expect(mockApiFetch).toHaveBeenCalledWith('/api/stocks/stock-7203/position/sell')

    // 銘柄カード由来：stock-{symbol} 形式
    mockApiFetch.mockClear()
    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId: 'stock-7203' })
    })
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/api/stocks/stock-7203/position/sell')
    )
  })

  it('宛先を特定できない detail では再取得しない', async () => {
    stubListFetch()
    const { result } = renderHook(() => useStockData())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, {})
    })

    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('再取得が失敗してもキャッシュは維持される', async () => {
    stubListFetch()
    mockApiFetch.mockRejectedValue(new Error('network'))
    const { result } = renderHook(() => useStockData())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { symbol: '7203' })
    })

    expect(result.current.stockDataMap.get('7203')?.realizedTrades).toHaveLength(1)
  })
})
