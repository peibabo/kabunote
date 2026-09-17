import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRealizedTradesBase } from '@/hooks/util/useRealizedTradesBase'
import { APP_EVENTS, emitAppEvent } from '@/lib/appEvents'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const TRADES = [{ id: 't1', symbol: '7203' }]

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data }),
  })
}

describe('useRealizedTradesBase', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  it('指定エンドポイントから初回取得する', async () => {
    const fetchMock = mockFetchOk(TRADES)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useRealizedTradesBase('/api/portfolio/realized'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchMock).toHaveBeenCalledWith('/api/portfolio/realized', undefined)
    expect(result.current.trades).toEqual(TRADES)
  })

  it('stockId 未指定なら全ての確定損益イベントで再取得する', async () => {
    const fetchMock = mockFetchOk(TRADES)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useRealizedTradesBase('/api/portfolio/realized'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId: 'stock-9999' })
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('stockId 指定時は他銘柄のイベントでは再取得しない', async () => {
    const fetchMock = mockFetchOk(TRADES)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useRealizedTradesBase('/api/stocks/stock-7203/position/sell', 'stock-7203')
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId: 'stock-9999' })
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('stockId 指定時でも自分宛てのイベントでは再取得する', async () => {
    const fetchMock = mockFetchOk(TRADES)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useRealizedTradesBase('/api/stocks/stock-7203/position/sell', 'stock-7203')
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId: 'stock-7203' })
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('stockId 指定時、detail自体が無いイベントでは再取得する', async () => {
    const fetchMock = mockFetchOk(TRADES)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useRealizedTradesBase('/api/stocks/stock-7203/position/sell', 'stock-7203')
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // emitAppEvent はこのイベントに必ず detail を付けるため、
    // detail 無しの発火（外部由来など）は素の CustomEvent で再現する
    await act(async () => {
      window.dispatchEvent(new CustomEvent(APP_EVENTS.DB_REALIZED_UPDATE))
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('stockId 指定時、宛先の無い detail では再取得しない', async () => {
    const fetchMock = mockFetchOk(TRADES)
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() =>
      useRealizedTradesBase('/api/stocks/stock-7203/position/sell', 'stock-7203')
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, {})
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
