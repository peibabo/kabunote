import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PUT } from '@/app/api/diary/route'

describe('GET /api/diary', () => {
  it('成功: 特定日の日記を取得（newsItems含む）', async () => {
    prismaMock.investmentDiary.findUnique.mockResolvedValue({
      id: 'diary-1',
      userId: 'user-1',
      diaryDate: new Date('2026-03-18'),
      marketOverview: '日経平均上昇',
      newsMemo: '',
      reflection: '冷静に対応できた',
      tomorrowFocus: '米CPI発表に注目',
      createdAt: new Date(),
      updatedAt: new Date('2026-03-18T10:00:00Z'),
      newsItems: [
        { id: 'news-1', url: 'https://example.com/news1', comment: '日銀会合', order: 0 },
        { id: 'news-2', url: 'https://example.com/news2', comment: '米CPI', order: 1 },
      ],
    } as never)

    const req = createRequest('GET', 'http://localhost:3000/api/diary?date=2026-03-18')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.diaryDate).toBe('2026-03-18')
    expect(json.data.marketOverview).toBe('日経平均上昇')
    expect(json.data.newsItems).toHaveLength(2)
    expect(json.data.newsItems[0].url).toBe('https://example.com/news1')
    expect(json.data.newsItems[0].comment).toBe('日銀会合')
  })

  it('成功: 日記がない日は空データを返す', async () => {
    prismaMock.investmentDiary.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/diary?date=2026-03-18')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.id).toBeNull()
    expect(json.data.newsItems).toEqual([])
  })

  it('成功: 月の日記日付リストを取得', async () => {
    prismaMock.investmentDiary.findMany.mockResolvedValue([
      { diaryDate: new Date('2026-03-01') },
      { diaryDate: new Date('2026-03-15') },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/diary?month=2026-03')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.dates).toEqual(['2026-03-01', '2026-03-15'])
  })

  it('400: パラメータなし', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/diary')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('400: 不正な日付形式', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/diary?date=invalid')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })

  it('400: 不正な月形式', async () => {
    const req = createRequest('GET', 'http://localhost:3000/api/diary?month=2026')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/diary', () => {
  it('成功: 日記をnewsItems付きで保存', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        investmentDiary: {
          upsert: prismaMock.investmentDiary.upsert,
        },
        diaryNewsItem: {
          deleteMany: prismaMock.diaryNewsItem.deleteMany,
          createMany: prismaMock.diaryNewsItem.createMany,
        },
      })
    })
    prismaMock.investmentDiary.upsert.mockResolvedValue({
      id: 'diary-1',
      userId: 'user-1',
      diaryDate: new Date('2026-03-18'),
      marketOverview: '日経平均上昇',
      newsMemo: '',
      reflection: '',
      tomorrowFocus: '',
      createdAt: new Date(),
      updatedAt: new Date('2026-03-18T10:00:00Z'),
    } as never)
    prismaMock.diaryNewsItem.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.diaryNewsItem.createMany.mockResolvedValue({ count: 1 })

    const req = createRequest('PUT', 'http://localhost:3000/api/diary', {
      date: '2026-03-18',
      marketOverview: '日経平均上昇',
      newsItems: [{ url: 'https://example.com', comment: 'テスト' }],
    })
    const res = await PUT(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.diaryDate).toBe('2026-03-18')
  })

  it('400: 日付なし', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/diary', {
      marketOverview: 'テスト',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 不正なURL', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/diary', {
      date: '2026-03-18',
      newsItems: [{ url: 'invalid-url', comment: 'テスト' }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: ニュース21件超過', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/diary', {
      date: '2026-03-18',
      newsItems: Array.from({ length: 21 }, (_, i) => ({
        url: `https://example.com/${i}`,
        comment: '',
      })),
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: コメント500文字超過', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/diary', {
      date: '2026-03-18',
      newsItems: [{ url: 'https://example.com', comment: 'あ'.repeat(501) }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
