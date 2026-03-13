import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/stocks/[stockId]/memo/route'

const mockMemo = {
  id: 'memo-1',
  stockId: 'stock-uuid-1',
  content: 'テストメモ',
  updatedAt: new Date('2024-06-01'),
}

describe('GET /api/stocks/[stockId]/memo', () => {
  beforeEach(() => {
    // withStock uses resolveStockId which calls prisma.stock.findFirst
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: メモを取得', async () => {
    prismaMock.stockMemo.findUnique.mockResolvedValue(mockMemo as never)
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/memo')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.content).toBe('テストメモ')
  })

  it('lazy作成: メモが存在しない場合空メモを作成', async () => {
    prismaMock.stockMemo.findUnique.mockResolvedValue(null)
    prismaMock.stockMemo.create.mockResolvedValue({
      ...mockMemo,
      content: '',
    } as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/memo')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stockMemo.create).toHaveBeenCalled()
  })
})

describe('PUT /api/stocks/[stockId]/memo', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: メモを更新（upsert）', async () => {
    prismaMock.stockMemo.upsert.mockResolvedValue({
      ...mockMemo,
      content: '更新メモ',
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/memo', {
      content: '更新メモ',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.content).toBe('更新メモ')
  })

  it('400: contentが文字列でない', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/memo', {
      content: 123,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/stocks/[stockId]/memo', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: メモを削除', async () => {
    prismaMock.stockMemo.delete.mockResolvedValue(mockMemo as never)
    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/memo')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('存在しないメモの削除もsuccess', async () => {
    prismaMock.stockMemo.delete.mockRejectedValue(
      new Error('Record to delete does not exist')
    )
    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/memo')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
