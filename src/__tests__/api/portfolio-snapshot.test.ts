import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { POST } from '@/app/api/portfolio/snapshot/route'
import { GET } from '@/app/api/portfolio/history/route'

describe('POST /api/portfolio/snapshot', () => {
  it('成功: スナップショットを作成', async () => {
    prismaMock.stock.findMany.mockResolvedValue([
      {
        id: 'stock-1',
        symbol: '7203',
        prices: [{ currentPrice: '2000' }],
        positions: [
          { id: 'pos-1', shares: 100, purchasePrice: '1500', purchaseDate: '2024-06-01', createdAt: new Date() },
        ],
      },
    ] as never)

    prismaMock.user.findUnique.mockResolvedValue({
      cashAmount: '500000',
    } as never)

    prismaMock.portfolioSnapshot.upsert.mockResolvedValue({
      id: 'snap-1',
      snapshotDate: new Date('2024-06-15'),
      totalInvestment: '150000',
      totalValue: '200000',
      profitLoss: '50000',
      cashAmount: '500000',
      netAssets: '700000',
    } as never)

    prismaMock.stockPriceSnapshot.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.stockPriceSnapshot.createMany.mockResolvedValue({ count: 1 })

    const req = createRequest('POST', 'http://localhost:3000/api/portfolio/snapshot')
    const res = await POST(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.totalValue).toBe(200000)
    expect(json.data.netAssets).toBe(700000)
  })

  it('400: ポジションが0の場合', async () => {
    prismaMock.stock.findMany.mockResolvedValue([
      {
        id: 'stock-1',
        symbol: '7203',
        prices: [{ currentPrice: '2000' }],
        positions: [],
      },
    ] as never)

    prismaMock.user.findUnique.mockResolvedValue({
      cashAmount: '0',
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/portfolio/snapshot')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: 銘柄が0の場合', async () => {
    prismaMock.stock.findMany.mockResolvedValue([] as never)
    prismaMock.user.findUnique.mockResolvedValue({ cashAmount: '0' } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/portfolio/snapshot')
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/portfolio/history', () => {
  it('成功: 履歴を取得', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      {
        id: 'snap-1',
        snapshotDate: new Date('2024-06-15'),
        totalInvestment: '150000',
        totalValue: '200000',
        profitLoss: '50000',
        cashAmount: '500000',
        netAssets: '700000',
        stockSnapshots: [
          {
            symbol: '7203',
            currentPrice: '2000',
            shares: 100,
            value: '200000',
            cost: '150000',
          },
        ],
      },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/history?range=1M')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].snapshotDate).toBe('2024-06-15')
    expect(json.data[0].totalValue).toBe(200000)
    expect(json.data[0].stockSnapshots[0].symbol).toBe('7203')
  })

  it('成功: range=ALL で全件取得', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/history?range=ALL')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(0)

    // ALL の場合は snapshotDate フィルタなし
    const calls = prismaMock.portfolioSnapshot.findMany.mock.calls
    const callArgs = calls[calls.length - 1][0]
    expect(callArgs.where.snapshotDate).toBeUndefined()
  })

  it('デフォルト: rangeなしの場合は1M', async () => {
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/history')
    const res = await GET(req)
    expect(res.status).toBe(200)

    // 30日前からのフィルタが設定されている
    const calls = prismaMock.portfolioSnapshot.findMany.mock.calls
    const callArgs = calls[calls.length - 1][0]
    expect(callArgs.where.snapshotDate).toBeDefined()
    expect(callArgs.where.snapshotDate.gte).toBeInstanceOf(Date)
  })
})
