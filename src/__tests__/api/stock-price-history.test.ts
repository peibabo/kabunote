import { describe, it, expect, vi } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/stocks/[stockId]/price-history/route'

// resolveStockId mock
vi.mock('@/lib/resolveStockId', () => ({
  resolveStockId: vi.fn().mockResolvedValue('stock-db-id'),
}))

describe('GET /api/stocks/[stockId]/price-history', () => {
  it('成功: 株価履歴を取得', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      {
        id: 'snap-1',
        snapshotDate: new Date('2024-06-15'),
        stockSnapshots: [
          {
            stockId: 'stock-db-id',
            symbol: '7203',
            currentPrice: '2000',
            shares: 100,
            value: '200000',
            cost: '150000',
          },
        ],
      },
      {
        id: 'snap-2',
        snapshotDate: new Date('2024-06-16'),
        stockSnapshots: [
          {
            stockId: 'stock-db-id',
            symbol: '7203',
            currentPrice: '2100',
            shares: 100,
            value: '210000',
            cost: '150000',
          },
        ],
      },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/7203/price-history?range=1M')
    const res = await GET(req, createParams({ stockId: '7203' }))
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.history).toHaveLength(2)
    expect(json.history[0]).toEqual({
      date: '2024-06-15',
      price: 2000,
      shares: 100,
      value: 200000,
      cost: 150000,
    })
    expect(json.history[1].price).toBe(2100)
  })

  it('成功: スナップショットに該当銘柄がない場合は空配列', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      {
        id: 'snap-1',
        snapshotDate: new Date('2024-06-15'),
        stockSnapshots: [],
      },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/7203/price-history?range=3M')
    const res = await GET(req, createParams({ stockId: '7203' }))
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.history).toHaveLength(0)
  })

  it('デフォルト: rangeなしの場合は3M', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/7203/price-history')
    const res = await GET(req, createParams({ stockId: '7203' }))
    expect(res.status).toBe(200)

    const calls = prismaMock.portfolioSnapshot.findMany.mock.calls
    const callArgs = calls[calls.length - 1][0]
    expect(callArgs.where.snapshotDate).toBeDefined()
    expect(callArgs.where.snapshotDate.gte).toBeInstanceOf(Date)
  })

  it('成功: range=ALL で全件取得', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/7203/price-history?range=ALL')
    const res = await GET(req, createParams({ stockId: '7203' }))
    expect(res.status).toBe(200)

    const calls = prismaMock.portfolioSnapshot.findMany.mock.calls
    const callArgs = calls[calls.length - 1][0]
    expect(callArgs.where.snapshotDate).toBeUndefined()
  })
})
