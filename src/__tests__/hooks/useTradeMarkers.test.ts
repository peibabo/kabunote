import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTradeMarkers } from '@/hooks/stock/useTradeMarkers'
import { APP_EVENTS, emitAppEvent } from '@/lib/appEvents'
import type { Position } from '@/types/positions'
import type { RealizedTrade } from '@/types/realizedTrade'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

// StockMiniChart には DBのcuid が渡る（`stock-7203` 形式ではない）。
// イベント照合が cuid でも成立することを検証するため、本番と同じ形で固定する
const STOCK_ID = 'clz1a2b3c4d5e6f7g8h9i0jk'
const SYMBOL = '7203'

const POSITIONS = [
  { id: 'p1', shares: 100, purchasePrice: 2400, purchaseDate: '2024-03-01', memo: '', taxRate: 0.20315, createdAt: '2024-03-01T00:00:00.000Z' },
] as Position[]

const TRADES = [
  { id: 't1', stockId: STOCK_ID, symbol: SYMBOL, soldShares: 50, sellPrice: 2800, costBasis: 2400, sellDate: '2024-05-10', realizedPL: 20000, taxRate: 0.20315, consumedLots: [], memo: '', createdAt: '2024-05-10T00:00:00.000Z' },
] as RealizedTrade[]

/** /position は Position[]、/position/sell は RealizedTrade[] を返す */
function mockFetchByUrl() {
  return vi.fn().mockImplementation((url: string) => Promise.resolve({
    ok: true,
    json: async () => ({ success: true, data: url.endsWith('/sell') ? TRADES : POSITIONS }),
  }))
}

describe('useTradeMarkers', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('購入ロット・売却履歴をマーカー形式に整形して返す', async () => {
    const fetchMock = mockFetchByUrl()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useTradeMarkers(STOCK_ID, SYMBOL))

    await waitFor(() => expect(result.current.buys).toHaveLength(1))
    expect(result.current.buys[0]).toEqual({ date: '2024-03-01', shares: 100, price: 2400 })
    expect(result.current.sells[0]).toEqual({ date: '2024-05-10', shares: 50, price: 2800 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('stockId が無い間はフェッチしない', () => {
    const fetchMock = mockFetchByUrl()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useTradeMarkers(undefined, SYMBOL))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.buys).toEqual([])
    expect(result.current.sells).toEqual([])
  })

  // 銘柄カードを多数並べた際の N+1 API Call 対策
  it('initialData 指定時は初回フェッチを行わずマーカーを即座に返す', () => {
    const fetchMock = mockFetchByUrl()
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useTradeMarkers(STOCK_ID, SYMBOL, { initialData: { positions: POSITIONS, trades: TRADES } })
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.buys[0]).toEqual({ date: '2024-03-01', shares: 100, price: 2400 })
    expect(result.current.sells[0]).toEqual({ date: '2024-05-10', shares: 50, price: 2800 })
  })

  // stockId は cuid なので、detail の各形式で宛先判定が成立する必要がある
  it.each([
    ['売却（symbol + stock-{symbol} 形式）', { symbol: SYMBOL, stockId: `stock-${SYMBOL}` }],
    ['削除（stock-{symbol} 形式のみ）', { stockId: `stock-${SYMBOL}` }],
    ['ポートフォリオ由来（cuid のみ）', { stockId: STOCK_ID }],
  ])('initialData 指定時でも自分宛てのイベントでは再取得する: %s', async (_label, detail) => {
    const fetchMock = mockFetchByUrl()
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() =>
      useTradeMarkers(STOCK_ID, SYMBOL, { initialData: { positions: [], trades: [] } })
    )
    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, detail)
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('initialData 指定時でも購入ポジション更新イベントでは再取得する', async () => {
    const fetchMock = mockFetchByUrl()
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() =>
      useTradeMarkers(STOCK_ID, SYMBOL, { initialData: { positions: [], trades: [] } })
    )

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_POSITION_UPDATE, { symbol: SYMBOL, positions: POSITIONS })
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('他銘柄のイベントでは再取得しない', async () => {
    const fetchMock = mockFetchByUrl()
    vi.stubGlobal('fetch', fetchMock)

    renderHook(() =>
      useTradeMarkers(STOCK_ID, SYMBOL, { initialData: { positions: [], trades: [] } })
    )

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId: 'stock-9999' })
      emitAppEvent(APP_EVENTS.DB_POSITION_UPDATE, { symbol: '9999', positions: [] })
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
