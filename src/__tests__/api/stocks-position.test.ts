import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, POST } from '@/app/api/stocks/[stockId]/position/route'
import { PUT, DELETE } from '@/app/api/stocks/[stockId]/position/[positionId]/route'

const mockPosition = {
  id: 'pos-1',
  stockId: 'stock-uuid-1',
  shares: 100,
  purchasePrice: 2400,
  purchaseDate: '2024-03-01',
  memo: 'テスト',
  createdAt: new Date('2024-03-01'),
}

describe('GET /api/stocks/[stockId]/position', () => {
  it('成功: ポジション一覧を取得', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockPosition.findMany.mockResolvedValue([mockPosition] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/position')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
  })

  it('銘柄未発見時は空配列', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-9999/position')
    const res = await GET(req, createParams({ stockId: 'stock-9999' }))
    const json = await getJson(res)
    expect(json.data).toEqual([])
  })
})

describe('POST /api/stocks/[stockId]/position', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockPosition.create.mockResolvedValue(mockPosition as never)
  })

  it('成功: ポジションを作成', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position', {
      shares: 100,
      purchasePrice: 2400,
      purchaseDate: '2024-03-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.shares).toBe(100)
  })

  it('400: shares<=0', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position', {
      shares: 0,
      purchasePrice: 2400,
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('400: purchasePrice<=0', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position', {
      shares: 100,
      purchasePrice: -1,
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/stocks/[stockId]/position/[positionId]', () => {
  it('成功: ポジションを更新', async () => {
    prismaMock.stockPosition.findFirst.mockResolvedValue(mockPosition as never)
    prismaMock.stockPosition.update.mockResolvedValue({
      ...mockPosition,
      shares: 200,
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/position/pos-1', {
      shares: 200,
      purchasePrice: 2400,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203', positionId: 'pos-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('404: ポジションが見つからない', async () => {
    prismaMock.stockPosition.findFirst.mockResolvedValue(null)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/position/pos-999', {
      shares: 200,
      purchasePrice: 2400,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203', positionId: 'pos-999' }))
    expect(res.status).toBe(404)
  })

  it('400: shares検証', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/position/pos-1', {
      shares: -1,
      purchasePrice: 2400,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203', positionId: 'pos-1' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/stocks/[stockId]/position/[positionId]', () => {
  it('成功: ポジションを削除', async () => {
    prismaMock.stockPosition.findFirst.mockResolvedValue(mockPosition as never)
    prismaMock.stockPosition.delete.mockResolvedValue(mockPosition as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/position/pos-1')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203', positionId: 'pos-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('404: ポジションが見つからない', async () => {
    prismaMock.stockPosition.findFirst.mockResolvedValue(null)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/position/pos-999')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203', positionId: 'pos-999' }))
    expect(res.status).toBe(404)
  })
})
