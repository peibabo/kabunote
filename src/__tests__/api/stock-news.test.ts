import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT } from '@/app/api/stocks/[stockId]/news/route'

const mockNewsItems = [
  { id: 'news-1', stockId: 'stock-uuid-1', userId: 'user-1', url: 'https://example.com/1', comment: 'テスト1', order: 0, createdAt: new Date() },
  { id: 'news-2', stockId: 'stock-uuid-1', userId: 'user-1', url: 'https://example.com/2', comment: '', order: 1, createdAt: new Date() },
]

describe('GET /api/stocks/[stockId]/news', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: 銘柄ニュースを取得', async () => {
    prismaMock.stockNewsItem.findMany.mockResolvedValue(mockNewsItems as never)
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/news')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.items).toHaveLength(2)
    expect(json.data.items[0].url).toBe('https://example.com/1')
    expect(json.data.items[0].comment).toBe('テスト1')
  })

  it('成功: ニュースが空の場合', async () => {
    prismaMock.stockNewsItem.findMany.mockResolvedValue([])
    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/news')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.items).toHaveLength(0)
  })
})

describe('PUT /api/stocks/[stockId]/news', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockNewsItem.deleteMany.mockResolvedValue({ count: 0 } as never)
    prismaMock.stockNewsItem.createMany.mockResolvedValue({ count: 2 } as never)
  })

  it('成功: ニュースを一括更新', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/news', {
      newsItems: [
        { url: 'https://example.com/a', comment: 'コメントA' },
        { url: 'https://example.com/b' },
      ],
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.updatedAt).toBeDefined()
    expect(prismaMock.stockNewsItem.deleteMany).toHaveBeenCalledWith({ where: { stockId: 'stock-uuid-1' } })
    expect(prismaMock.stockNewsItem.createMany).toHaveBeenCalled()
  })

  it('エラー: URLが無効', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/news', {
      newsItems: [{ url: 'invalid-url', comment: '' }],
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('エラー: 21件以上', async () => {
    const items = Array.from({ length: 21 }, (_, i) => ({
      url: `https://example.com/${i}`,
      comment: '',
    }))
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/news', {
      newsItems: items,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('エラー: コメントが500文字超過', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/news', {
      newsItems: [{ url: 'https://example.com', comment: 'x'.repeat(501) }],
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('成功: 空のnewsItemsで全削除', async () => {
    prismaMock.stockNewsItem.createMany.mockClear()
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/news', {
      newsItems: [],
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stockNewsItem.deleteMany).toHaveBeenCalled()
    expect(prismaMock.stockNewsItem.createMany).not.toHaveBeenCalled()
  })
})
