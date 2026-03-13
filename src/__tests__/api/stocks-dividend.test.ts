import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/stocks/[stockId]/dividend/route'

const mockDividend = {
  stockId: 'stock-uuid-1',
  dividendPerShare: 50,
  frequency: 2,
  rightsMonth: 3,
  rightsDay: 31,
}

describe('GET /api/stocks/[stockId]/dividend', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: 配当情報を取得', async () => {
    prismaMock.stockDividend.findUnique.mockResolvedValue(mockDividend as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/dividend')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.frequency).toBe(2)
  })

  it('未設定の場合null', async () => {
    prismaMock.stockDividend.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/dividend')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.data).toBeNull()
  })
})

describe('PUT /api/stocks/[stockId]/dividend', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: 配当情報を更新（upsert）', async () => {
    prismaMock.stockDividend.upsert.mockResolvedValue(mockDividend as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/dividend', {
      dividendPerShare: 50,
      frequency: 2,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stockDividend.upsert).toHaveBeenCalled()
  })
})

describe('DELETE /api/stocks/[stockId]/dividend', () => {
  it('成功: 配当情報を削除', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockDividend.deleteMany.mockResolvedValue({ count: 1 } as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/dividend')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
