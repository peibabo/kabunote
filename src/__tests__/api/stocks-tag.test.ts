import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, POST } from '@/app/api/stocks/[stockId]/tag/route'
import { DELETE } from '@/app/api/stocks/[stockId]/tag/[tagId]/route'

const mockTag = {
  id: 'tag-1',
  stockId: 'stock-uuid-1',
  name: '高配当',
  color: 'red',
  createdAt: new Date('2024-06-01'),
}

describe('GET /api/stocks/[stockId]/tag', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: タグ一覧を取得', async () => {
    prismaMock.stockTag.findMany.mockResolvedValue([mockTag] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/tag')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].label).toBe('高配当')
  })
})

describe('POST /api/stocks/[stockId]/tag', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: タグを追加', async () => {
    prismaMock.stockTag.upsert.mockResolvedValue(mockTag as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/tag', {
      label: '高配当',
      color: 'red',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.label).toBe('高配当')
  })

  it('400: label未指定', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/tag', {
      color: 'red',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('重複: upsertで既存を更新', async () => {
    prismaMock.stockTag.upsert.mockResolvedValue({ ...mockTag, color: 'blue' } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/tag', {
      label: '高配当',
      color: 'blue',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.data.color).toBe('blue')
  })
})

describe('DELETE /api/stocks/[stockId]/tag/[tagId]', () => {
  it('成功: タグを削除', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockTag.deleteMany.mockResolvedValue({ count: 1 } as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/tag/tag-1')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203', tagId: 'tag-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
