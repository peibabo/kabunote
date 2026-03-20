import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/portfolio/chart-memos/list/route'

describe('GET /api/portfolio/chart-memos/list', () => {
  it('成功: チャートメモ一覧を取得', async () => {
    const now = new Date()
    prismaMock.chartMemo.findMany.mockResolvedValue([
      {
        id: 'memo-1',
        userId: 'user-1',
        snapshotDate: new Date('2024-06-15'),
        chartType: 'value',
        symbol: '',
        content: 'テストメモ',
        createdAt: now,
        updatedAt: now,
      },
    ] as never)
    prismaMock.chartMemo.count.mockResolvedValue(1)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.items).toHaveLength(1)
    expect(json.data.items[0].snapshotDate).toBe('2024-06-15')
    expect(json.data.items[0].content).toBe('テストメモ')
    expect(json.data.items[0].createdAt).toBeDefined()
    expect(json.data.total).toBe(1)
  })

  it('成功: 空の一覧', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([])
    prismaMock.chartMemo.count.mockResolvedValue(0)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.items).toHaveLength(0)
    expect(json.data.total).toBe(0)
  })

  it('成功: limit/offset指定', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([])
    prismaMock.chartMemo.count.mockResolvedValue(100)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list?limit=10&offset=20')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(prismaMock.chartMemo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20,
        take: 10,
      })
    )
  })

  it('成功: chartType=valueでフィルタ', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([])
    prismaMock.chartMemo.count.mockResolvedValue(0)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list?chartType=value')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(prismaMock.chartMemo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ chartType: 'value' }),
      })
    )
  })

  it('成功: chartType=allで全件（chartType条件なし）', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([])
    prismaMock.chartMemo.count.mockResolvedValue(0)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list?chartType=all')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(prismaMock.chartMemo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'test-user-id-123' },
      })
    )
  })

  it('成功: 個別株メモに銘柄名が含まれる', async () => {
    const now = new Date()
    prismaMock.chartMemo.findMany.mockResolvedValue([
      {
        id: 'memo-1',
        userId: 'test-user-id-123',
        snapshotDate: new Date('2024-06-15'),
        chartType: 'stocks',
        symbol: '7203',
        content: 'トヨタ好決算',
        createdAt: now,
        updatedAt: now,
      },
    ] as never)
    prismaMock.chartMemo.count.mockResolvedValue(1)
    prismaMock.stock.findMany.mockResolvedValue([
      { symbol: '7203', name: 'トヨタ自動車' },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.items[0].symbol).toBe('7203')
    expect(json.data.items[0].stockName).toBe('トヨタ自動車')
  })

  it('成功: limitが上限100を超えない', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([])
    prismaMock.chartMemo.count.mockResolvedValue(0)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos/list?limit=999')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(prismaMock.chartMemo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    )
  })
})
