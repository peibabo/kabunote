import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadPriceHistory } from '@/lib/priceHistoryLoader'

const ITEM = (date: string) => ({ snapshotId: `s-${date}`, date, price: 100, shares: 1, value: 100, cost: 90 })

function mockFetchOk(history: Record<string, ReturnType<typeof ITEM>[]>) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, history }),
  })
}

/** 呼び出しURLから stockIds を配列で取り出す */
function stockIdsOf(fetchMock: ReturnType<typeof vi.fn>, callIndex = 0): string[] {
  const url = new URL(fetchMock.mock.calls[callIndex][0] as string, 'http://localhost')
  return (url.searchParams.get('stockIds') ?? '').split(',')
}

describe('loadPriceHistory', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllGlobals())

  // これが本題：カード数ぶんの要求が1本の一括リクエストになる
  it('同一フレームの複数銘柄の要求を1本の一括リクエストにまとめる', async () => {
    const fetchMock = mockFetchOk({ a: [ITEM('2026-01-01')], b: [ITEM('2026-01-02')] })
    vi.stubGlobal('fetch', fetchMock)

    const [a, b] = await Promise.all([
      loadPriceHistory('a', '3M'),
      loadPriceHistory('b', '3M'),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(stockIdsOf(fetchMock).sort()).toEqual(['a', 'b'])
    expect(a[0].date).toBe('2026-01-01')
    expect(b[0].date).toBe('2026-01-02')
  })

  it('同じ銘柄を複数回要求しても stockIds は一意化される', async () => {
    const fetchMock = mockFetchOk({ a: [ITEM('2026-01-01')] })
    vi.stubGlobal('fetch', fetchMock)

    const [first, second] = await Promise.all([
      loadPriceHistory('a', '3M'),
      loadPriceHistory('a', '3M'),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(stockIdsOf(fetchMock)).toEqual(['a'])
    expect(first).toEqual(second)
  })

  it('期間が違えば別リクエストになる', async () => {
    const fetchMock = mockFetchOk({ a: [] })
    vi.stubGlobal('fetch', fetchMock)

    await Promise.all([
      loadPriceHistory('a', '3M'),
      loadPriceHistory('a', '1Y'),
    ])

    expect(fetchMock).toHaveBeenCalledTimes(2)
    const ranges = fetchMock.mock.calls
      .map(c => new URL(c[0] as string, 'http://localhost').searchParams.get('range'))
      .sort()
    expect(ranges).toEqual(['1Y', '3M'])
  })

  it('履歴が返らなかった銘柄は空配列になる', async () => {
    const fetchMock = mockFetchOk({ a: [ITEM('2026-01-01')] })
    vi.stubGlobal('fetch', fetchMock)

    const [, b] = await Promise.all([
      loadPriceHistory('a', '3M'),
      loadPriceHistory('b', '3M'),
    ])

    expect(b).toEqual([])
  })

  it('失敗時はバッチ内の全要求が reject される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const results = await Promise.allSettled([
      loadPriceHistory('a', '3M'),
      loadPriceHistory('b', '3M'),
    ])

    expect(results.every(r => r.status === 'rejected')).toBe(true)
  })

  it('バッチ確定後の要求は次のバッチになる', async () => {
    const fetchMock = mockFetchOk({ a: [], b: [] })
    vi.stubGlobal('fetch', fetchMock)

    await loadPriceHistory('a', '3M')
    await loadPriceHistory('b', '3M')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(stockIdsOf(fetchMock, 0)).toEqual(['a'])
    expect(stockIdsOf(fetchMock, 1)).toEqual(['b'])
  })
})
