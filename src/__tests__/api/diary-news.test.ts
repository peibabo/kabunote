import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/diary/news/route'

describe('GET /api/diary/news', () => {
  beforeEach(() => {
    // デフォルトで銘柄ニュースは空
    prismaMock.stockNewsItem.findMany.mockResolvedValue([])
    prismaMock.stockNewsItem.count.mockResolvedValue(0)
  })

  it('成功: ニュース一覧を取得', async () => {
    prismaMock.diaryNewsItem.findMany.mockResolvedValue([
      {
        id: 'news-1',
        url: 'https://example.com/1',
        comment: '日銀会合',
        createdAt: new Date('2026-03-18T10:00:00Z'),
        diary: { diaryDate: new Date('2026-03-18') },
      },
      {
        id: 'news-2',
        url: 'https://example.com/2',
        comment: '米CPI',
        createdAt: new Date('2026-03-17T10:00:00Z'),
        diary: { diaryDate: new Date('2026-03-17') },
      },
    ] as never)
    prismaMock.diaryNewsItem.count.mockResolvedValue(2)

    const req = createRequest('GET', 'http://localhost:3000/api/diary/news')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.items).toHaveLength(2)
    expect(json.data.items[0].url).toBe('https://example.com/1')
    expect(json.data.items[0].diaryDate).toBe('2026-03-18')
    expect(json.data.total).toBe(2)
  })

  it('成功: 空の一覧', async () => {
    prismaMock.diaryNewsItem.findMany.mockResolvedValue([])
    prismaMock.diaryNewsItem.count.mockResolvedValue(0)

    const req = createRequest('GET', 'http://localhost:3000/api/diary/news')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.items).toHaveLength(0)
    expect(json.data.total).toBe(0)
  })

  it('成功: limit/offset指定', async () => {
    prismaMock.diaryNewsItem.findMany.mockResolvedValue([])
    prismaMock.diaryNewsItem.count.mockResolvedValue(100)

    const req = createRequest('GET', 'http://localhost:3000/api/diary/news?limit=10&offset=20')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.total).toBe(100)
  })

  it('成功: source=diaryで日記のみ', async () => {
    prismaMock.diaryNewsItem.findMany.mockResolvedValue([
      {
        id: 'news-1',
        url: 'https://example.com/1',
        comment: 'テスト',
        createdAt: new Date('2026-03-18T10:00:00Z'),
        diary: { diaryDate: new Date('2026-03-18') },
      },
    ] as never)
    prismaMock.diaryNewsItem.count.mockResolvedValue(1)

    const req = createRequest('GET', 'http://localhost:3000/api/diary/news?source=diary')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.items).toHaveLength(1)
    expect(json.data.items[0].source).toBe('diary')
  })

  it('成功: source=stockで銘柄のみ', async () => {
    prismaMock.stockNewsItem.findMany.mockResolvedValue([
      {
        id: 'sn-1',
        url: 'https://example.com/stock',
        comment: '銘柄ニュース',
        createdAt: new Date('2026-03-18T10:00:00Z'),
        stock: { symbol: '7203', name: 'トヨタ自動車' },
      },
    ] as never)
    prismaMock.stockNewsItem.count.mockResolvedValue(1)

    const req = createRequest('GET', 'http://localhost:3000/api/diary/news?source=stock')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.items).toHaveLength(1)
    expect(json.data.items[0].source).toBe('stock')
    expect(json.data.items[0].symbol).toBe('7203')
  })
})
