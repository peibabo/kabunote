import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/stocks/[stockId]/next-action-plan/route'

const mockNAP = {
  id: 'nap-1',
  stockId: 'stock-uuid-1',
  actionType: 'BUY',
  priority: 'MEDIUM',
  targetPrice: 1500,
  targetShares: 100,
  strategyMemo: 'テスト戦略',
  updatedAt: new Date('2024-06-01'),
}

describe('GET /api/stocks/[stockId]/next-action-plan', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: NAP取得', async () => {
    prismaMock.nextActionPlan.findUnique.mockResolvedValue(mockNAP as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.actionType).toBe('buy')
    expect(json.data.priority).toBe('medium')
  })

  it('未設定時にデフォルト作成', async () => {
    prismaMock.nextActionPlan.findUnique.mockResolvedValue(null)
    prismaMock.nextActionPlan.create.mockResolvedValue(mockNAP as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan')
    await GET(req, createParams({ stockId: 'stock-7203' }))
    expect(prismaMock.nextActionPlan.create).toHaveBeenCalled()
  })
})

describe('PUT /api/stocks/[stockId]/next-action-plan', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: NAPを更新（upsert）', async () => {
    prismaMock.nextActionPlan.upsert.mockResolvedValue(mockNAP as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan', {
      actionType: 'buy',
      priority: 'high',
      targetPrice: 1500,
      targetQuantity: 200,
      memo: '更新',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.nextActionPlan.upsert).toHaveBeenCalled()
  })

  it('400: 不正なactionType', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan', {
      actionType: 'invalid',
      priority: 'medium',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('400: 不正なpriority', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan', {
      actionType: 'buy',
      priority: 'invalid',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('新規作成: 未設定時もupsertで処理', async () => {
    prismaMock.nextActionPlan.upsert.mockResolvedValue(mockNAP as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan', {
      actionType: 'sell',
      priority: 'low',
    })
    await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(prismaMock.nextActionPlan.upsert).toHaveBeenCalled()
  })
})

describe('DELETE /api/stocks/[stockId]/next-action-plan', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: NAPを削除', async () => {
    prismaMock.nextActionPlan.delete.mockResolvedValue(mockNAP as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('既に削除済みでもsuccess', async () => {
    prismaMock.nextActionPlan.delete.mockRejectedValue(
      new Error('Record to delete does not exist')
    )

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/next-action-plan')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
