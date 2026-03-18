import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT } from '@/app/api/stocks/[stockId]/price/route'

const mockPrice = {
  stockId: 'stock-uuid-1',
  currentPrice: 2500,
  targetPrice: 3000,
  stopLossPrice: 2200,
  per: 15.5,
  pbr: 1.2,
  updatedAt: new Date('2024-06-01'),
}

describe('GET /api/stocks/[stockId]/price', () => {
  it('成功: 価格情報を取得', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockPrice.findUnique.mockResolvedValue(mockPrice as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/price')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.currentPrice).toBe(2500)
    expect(json.data.per).toBe(15.5)
    expect(json.data.pbr).toBe(1.2)
  })

  it('銘柄未発見時はnullデータ返却', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-9999/price')
    const res = await GET(req, createParams({ stockId: 'stock-9999' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.currentPrice).toBeNull()
    expect(json.data.per).toBeNull()
    expect(json.data.pbr).toBeNull()
  })

  it('priceレコードなしの場合nullを返す', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockPrice.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/price')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.data.currentPrice).toBeNull()
    expect(json.data.per).toBeNull()
    expect(json.data.pbr).toBeNull()
  })
})

describe('PUT /api/stocks/[stockId]/price', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: 価格を更新（upsert）', async () => {
    prismaMock.stockPrice.upsert.mockResolvedValue({
      ...mockPrice,
      currentPrice: 2600,
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/price', {
      currentPrice: 2600,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stockPrice.upsert).toHaveBeenCalled()
  })

  it('部分更新: 指定したフィールドのみ更新', async () => {
    prismaMock.stockPrice.upsert.mockResolvedValue(mockPrice as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/price', {
      currentPrice: 2700,
    })
    await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(prismaMock.stockPrice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          currentPrice: 2700,
        }),
      })
    )
  })

  it('PER/PBRを更新', async () => {
    prismaMock.stockPrice.upsert.mockResolvedValue({
      ...mockPrice,
      per: 12.3,
      pbr: 0.9,
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/price', {
      per: 12.3,
      pbr: 0.9,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stockPrice.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          per: 12.3,
          pbr: 0.9,
        }),
      })
    )
  })

  it('不正なPER/PBR値を拒否', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/price', {
      per: -5,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(res.status).toBe(400)
    expect(json.error).toBe('Bad Request')
  })
})
