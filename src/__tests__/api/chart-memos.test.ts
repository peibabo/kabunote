import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/portfolio/chart-memos/route'

describe('GET /api/portfolio/chart-memos', () => {
  it('成功: メモ一覧を取得', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([
      {
        id: 'memo-1',
        userId: 'user-1',
        snapshotDate: new Date('2024-06-15'),
        chartType: 'value',
        symbol: '',
        content: 'テストメモ',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos?range=1M')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].snapshotDate).toBe('2024-06-15')
    expect(json.data[0].content).toBe('テストメモ')
  })

  it('成功: 空の一覧', async () => {
    prismaMock.chartMemo.findMany.mockResolvedValue([])

    const req = createRequest('GET', 'http://localhost:3000/api/portfolio/chart-memos?range=1W')
    const res = await GET(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(0)
  })
})

describe('PUT /api/portfolio/chart-memos', () => {
  it('成功: メモを作成', async () => {
    prismaMock.chartMemo.upsert.mockResolvedValue({
      id: 'memo-1',
      userId: 'user-1',
      snapshotDate: new Date('2024-06-15'),
      chartType: 'value',
      symbol: '',
      content: '決算発表で好材料',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/portfolio/chart-memos', {
      snapshotDate: '2024-06-15',
      chartType: 'value',
      content: '決算発表で好材料',
    })
    const res = await PUT(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.content).toBe('決算発表で好材料')
  })

  it('成功: 銘柄指定でメモを作成', async () => {
    prismaMock.chartMemo.upsert.mockResolvedValue({
      id: 'memo-2',
      userId: 'user-1',
      snapshotDate: new Date('2024-06-15'),
      chartType: 'stocks',
      symbol: '7203',
      content: 'トヨタ決算良好',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/portfolio/chart-memos', {
      snapshotDate: '2024-06-15',
      chartType: 'stocks',
      symbol: '7203',
      content: 'トヨタ決算良好',
    })
    const res = await PUT(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.data.symbol).toBe('7203')
  })

  it('400: 日付形式が不正', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/portfolio/chart-memos', {
      snapshotDate: 'invalid',
      chartType: 'value',
      content: 'テスト',
    })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('400: chartTypeが不正', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/portfolio/chart-memos', {
      snapshotDate: '2024-06-15',
      chartType: 'invalid',
      content: 'テスト',
    })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('400: contentが空', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/portfolio/chart-memos', {
      snapshotDate: '2024-06-15',
      chartType: 'value',
      content: '',
    })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })

  it('400: contentが50文字超過', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/portfolio/chart-memos', {
      snapshotDate: '2024-06-15',
      chartType: 'value',
      content: 'あ'.repeat(51),
    })
    const res = await PUT(req)

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/portfolio/chart-memos', () => {
  it('成功: メモを削除', async () => {
    prismaMock.chartMemo.deleteMany.mockResolvedValue({ count: 1 })

    const req = createRequest(
      'DELETE',
      'http://localhost:3000/api/portfolio/chart-memos?snapshotDate=2024-06-15&chartType=value&symbol='
    )
    const res = await DELETE(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
  })

  it('400: パラメータ不足', async () => {
    const req = createRequest(
      'DELETE',
      'http://localhost:3000/api/portfolio/chart-memos?snapshotDate=2024-06-15'
    )
    const res = await DELETE(req)

    expect(res.status).toBe(400)
  })
})
