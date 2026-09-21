import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/stocks/price-history/route'

const BASE = 'http://localhost:3000/api/stocks/price-history'

const snapshot = (id: string, date: string, stockSnapshots: unknown[]) => ({
  id,
  snapshotDate: new Date(`${date}T00:00:00.000Z`),
  stockSnapshots,
})

const stockSnapshot = (stockId: string, price: string | null) => ({
  stockId,
  currentPrice: price === null ? null : { toString: () => price },
  shares: 100,
  value: { toString: () => '250000' },
  cost: { toString: () => '240000' },
})

describe('GET /api/stocks/price-history', () => {
  beforeEach(() => {
    // 呼び出し回数を検証するテストがあるため履歴もリセットする
    vi.clearAllMocks()
    prismaMock.stock.findMany.mockResolvedValue([{ id: 'stock-a' }, { id: 'stock-b' }] as never)
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      snapshot('snap-1', '2026-01-01', [stockSnapshot('stock-a', '2500'), stockSnapshot('stock-b', '1200')]),
      snapshot('snap-2', '2026-01-02', [stockSnapshot('stock-a', '2600')]),
    ] as never)
  })

  it('銘柄IDごとに履歴を返す', async () => {
    const req = createRequest('GET', `${BASE}?range=3M&stockIds=stock-a,stock-b`)
    const res = await GET(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.history['stock-a']).toHaveLength(2)
    expect(json.history['stock-a'][0]).toEqual({
      snapshotId: 'snap-1',
      date: '2026-01-01',
      price: 2500,
      shares: 100,
      value: 250000,
      cost: 240000,
    })
    // スナップショットに含まれない日は詰めずにスキップする
    expect(json.history['stock-b']).toHaveLength(1)
  })

  it('スナップショットが1件も無い銘柄も空配列のキーを返す', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', `${BASE}?range=3M&stockIds=stock-a,stock-b`)
    const json = await getJson(await GET(req))

    expect(json.history).toEqual({ 'stock-a': [], 'stock-b': [] })
  })

  it('currentPrice が null でも price: null で返す', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      snapshot('snap-1', '2026-01-01', [stockSnapshot('stock-a', null)]),
    ] as never)

    const req = createRequest('GET', `${BASE}?range=3M&stockIds=stock-a`)
    const json = await getJson(await GET(req))

    expect(json.history['stock-a'][0].price).toBeNull()
  })

  // 他ユーザーの銘柄IDを渡されても応答にキーを作らない
  it('自分の銘柄でないIDは除外する', async () => {
    prismaMock.stock.findMany.mockResolvedValue([{ id: 'stock-a' }] as never)

    const req = createRequest('GET', `${BASE}?range=3M&stockIds=stock-a,stock-other-user`)
    const json = await getJson(await GET(req))

    expect(Object.keys(json.history)).toEqual(['stock-a'])
  })

  it('所有銘柄が1件も無ければ空オブジェクトを返す', async () => {
    prismaMock.stock.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', `${BASE}?range=3M&stockIds=stock-other-user`)
    const json = await getJson(await GET(req))

    expect(json.history).toEqual({})
    expect(prismaMock.portfolioSnapshot.findMany).not.toHaveBeenCalled()
  })

  it('stockIds が無ければ400', async () => {
    const req = createRequest('GET', `${BASE}?range=3M`)
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('stockIds が上限超過なら400', async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `stock-${i}`).join(',')
    const req = createRequest('GET', `${BASE}?range=3M&stockIds=${ids}`)
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it('range に応じて snapshotDate の下限を絞る', async () => {
    const req = createRequest('GET', `${BASE}?range=1M&stockIds=stock-a`)
    await GET(req)

    const where = prismaMock.portfolioSnapshot.findMany.mock.calls[0][0].where
    expect(where.snapshotDate.gte).toBeInstanceOf(Date)
  })

  it('対象銘柄のみをinclude条件に渡す（全銘柄を読まない）', async () => {
    const req = createRequest('GET', `${BASE}?range=3M&stockIds=stock-a,stock-b`)
    await GET(req)

    const args = prismaMock.portfolioSnapshot.findMany.mock.calls[0][0]
    expect(args.include.stockSnapshots.where.stockId.in).toEqual(['stock-a', 'stock-b'])
  })
})
