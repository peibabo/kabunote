import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/stocks/list/route'

const mockStockDbData = {
  id: 'stock-uuid-1',
  symbol: '7203',
  name: 'トヨタ自動車',
  sector: '自動車',
  market: '東証プライム',
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-06-01'),
  prices: [{
    currentPrice: { toString: () => '2500' },
    targetPrice: { toString: () => '3000' },
    stopLossPrice: { toString: () => '2200' },
  }],
  positions: [{
    id: 'pos-1',
    shares: 100,
    purchasePrice: { toString: () => '2400' },
    purchaseDate: '2024-03-01',
    memo: 'テスト',
    createdAt: new Date('2024-03-01'),
  }],
  events: [],
  dividend: null,
  benefit: null,
  tags: [],
  nextAction: null,
}

describe('GET /api/stocks/list', () => {
  beforeEach(() => {
    prismaMock.stock.findMany.mockResolvedValue([mockStockDbData] as never)
  })

  it('成功: 銘柄一覧を返す', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/list')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.count).toBe(1)
  })

  it('Decimal変換: pricesのDecimalがNumberに変換される', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/list')
    const res = await GET(req)
    const json = await getJson(res)
    const stock = json.data[0]
    expect(stock.currentPrice).toBe(2500)
    expect(stock.targetPrice).toBe(3000)
    expect(stock.stopLossPrice).toBe(2200)
  })

  it('order順にソートされる', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/list')
    await GET(req)
    expect(prismaMock.stock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { order: 'asc' },
      })
    )
  })

  it('0件の場合は空配列', async () => {
    prismaMock.stock.findMany.mockResolvedValue([] as never)
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/list')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.data).toEqual([])
    expect(json.count).toBe(0)
  })

  it('関連データを含む', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/list')
    await GET(req)
    expect(prismaMock.stock.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.objectContaining({
          prices: true,
          positions: expect.anything(),
          tags: expect.anything(),
        }),
      })
    )
  })
})
