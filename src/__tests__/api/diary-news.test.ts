import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/diary/news/route'

describe('GET /api/diary/news', () => {
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
})
