import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/stocks/[stockId]/benefit/route'

const mockBenefit = {
  stockId: 'stock-uuid-1',
  description: 'QUOカード1000円',
  minimumShares: 100,
  estimatedValue: 1000,
  rightsMonth: 3,
  rightsDay: 31,
}

describe('GET /api/stocks/[stockId]/benefit', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: 優待情報を取得', async () => {
    prismaMock.stockBenefit.findUnique.mockResolvedValue(mockBenefit as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/benefit')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.description).toBe('QUOカード1000円')
  })

  it('未設定の場合null', async () => {
    prismaMock.stockBenefit.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/benefit')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.data).toBeNull()
  })
})

describe('PUT /api/stocks/[stockId]/benefit', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: 優待情報を更新', async () => {
    prismaMock.stockBenefit.findUnique.mockResolvedValue(mockBenefit as never)
    prismaMock.stockBenefit.update.mockResolvedValue(mockBenefit as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/benefit', {
      description: 'QUOカード1000円',
      minimumShares: 100,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('新規作成: 未設定時', async () => {
    prismaMock.stockBenefit.findUnique.mockResolvedValue(null)
    prismaMock.stockBenefit.create.mockResolvedValue(mockBenefit as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/benefit', {
      description: 'QUOカード',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(prismaMock.stockBenefit.create).toHaveBeenCalled()
  })
})

describe('DELETE /api/stocks/[stockId]/benefit', () => {
  it('成功: 優待情報を削除', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockBenefit.deleteMany.mockResolvedValue({ count: 1 } as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/benefit')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
