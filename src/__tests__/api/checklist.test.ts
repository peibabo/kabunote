import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PUT } from '@/app/api/checklist/route'

describe('GET /api/checklist', () => {
  it('成功: レコードなし → 空checkedItems + streak 0', async () => {
    prismaMock.dailyChecklist.findMany.mockResolvedValue([])

    const req = createRequest('GET', 'http://localhost:3000/api/checklist')
    const res = await GET(req)
    const json = await getJson(res)

    expect(json.today.checkedItems).toEqual([])
    expect(json.streak.currentStreak).toBe(0)
    expect(json.streak.longestStreak).toBe(0)
    expect(json.streak.totalCompletedDays).toBe(0)
  })

  it('成功: レコードあり → 正しいデータ返却', async () => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    prismaMock.dailyChecklist.findMany.mockResolvedValue([
      { date: todayStr, checkedItems: [0, 2] },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/checklist')
    const res = await GET(req)
    const json = await getJson(res)

    expect(json.today.checkedItems).toEqual([0, 2])
    expect(json.streak.currentStreak).toBe(1)
  })
})

describe('PUT /api/checklist', () => {
  it('成功: 正常更新', async () => {
    prismaMock.dailyChecklist.upsert.mockResolvedValue({} as never)
    prismaMock.dailyChecklist.findMany.mockResolvedValue([
      { date: '2026-03-14', checkedItems: [0, 1] },
    ] as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/checklist', {
      date: '2026-03-14',
      checkedItems: [0, 1],
    })
    const res = await PUT(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.today.checkedItems).toEqual([0, 1])
  })

  it('400: 不正な日付形式', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/checklist', {
      date: '2026/03/14',
      checkedItems: [0],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 範囲外インデックス', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/checklist', {
      date: '2026-03-14',
      checkedItems: [0, 5],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 重複インデックス', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/checklist', {
      date: '2026-03-14',
      checkedItems: [0, 0],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 非整数', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/checklist', {
      date: '2026-03-14',
      checkedItems: [0.5],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
