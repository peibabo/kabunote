import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PATCH } from '@/app/api/gamification/titles/route'

beforeEach(() => {
  prismaMock.stock.count.mockReset()
  prismaMock.stockMemo.count.mockReset()
  prismaMock.stockTag.count.mockReset()
  prismaMock.stockTag.groupBy.mockReset()
  prismaMock.stockPosition.count.mockReset()
  prismaMock.stockDividend.count.mockReset()
  prismaMock.stockBenefit.count.mockReset()
  prismaMock.stockEvent.count.mockReset()
  prismaMock.nextActionPlan.count.mockReset()
  prismaMock.portfolioSnapshot.count.mockReset()
  prismaMock.feedback.count.mockReset()
  prismaMock.userGamification.findUnique.mockReset()
  prismaMock.userGamification.update.mockReset()
  prismaMock.xpActivityLog.findMany.mockReset()
})

function mockCounts(overrides: Partial<Record<string, number>> = {}, gamificationOverrides: { notifiedTitleIds?: string[] | null; level?: number; longestStreak?: number } = {}) {
  const defaults = {
    stock: 0, stockMemo: 0, stockTag: 0, stockPosition: 0,
    stockDividend: 0, stockBenefit: 0, stockEvent: 0,
    nextActionPlan: 0, portfolioSnapshot: 0, feedback: 0,
  }
  const counts = { ...defaults, ...overrides }

  // stock.countは2回呼ばれる（総数と、メモ付き銘柄数）
  prismaMock.stock.count
    .mockResolvedValueOnce(counts.stock as never)  // 総数
    .mockResolvedValueOnce(0 as never)              // メモ付き銘柄数
  prismaMock.stockMemo.count.mockResolvedValue(counts.stockMemo as never)
  prismaMock.stockTag.count.mockResolvedValue(counts.stockTag as never)
  prismaMock.stockTag.groupBy.mockResolvedValue([] as never)
  prismaMock.stockPosition.count.mockResolvedValue(counts.stockPosition as never)
  prismaMock.stockDividend.count.mockResolvedValue(counts.stockDividend as never)
  prismaMock.stockBenefit.count.mockResolvedValue(counts.stockBenefit as never)
  prismaMock.stockEvent.count.mockResolvedValue(counts.stockEvent as never)
  prismaMock.nextActionPlan.count.mockResolvedValue(counts.nextActionPlan as never)
  prismaMock.portfolioSnapshot.count.mockResolvedValue(counts.portfolioSnapshot as never)
  prismaMock.feedback.count.mockResolvedValue(counts.feedback as never)
  prismaMock.userGamification.findUnique.mockResolvedValue({
    level: gamificationOverrides.level ?? 1,
    longestStreak: gamificationOverrides.longestStreak ?? 0,
    notifiedTitleIds: 'notifiedTitleIds' in gamificationOverrides ? gamificationOverrides.notifiedTitleIds : [],
  } as never)
  prismaMock.xpActivityLog.findMany.mockResolvedValue([] as never)
}

describe('GET /api/gamification/titles', () => {
  it('成功: 全称号の状態を返す', async () => {
    mockCounts()

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.titles).toHaveLength(28)
    expect(json.data.totalCount).toBe(28)
    expect(json.data.unlockedCount).toBe(0)
    expect(json.data.notifiedTitleIds).toEqual([])
  })

  it('銘柄1個で「はじめの一歩」が獲得済み', async () => {
    mockCounts({ stock: 1 })

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    const firstStock = json.data.titles.find((t: { id: string }) => t.id === 'first_stock')
    expect(firstStock.unlocked).toBe(true)
    expect(json.data.unlockedCount).toBe(1)
    expect(json.data.notifiedTitleIds).toEqual([])
  })

  it('複数条件が同時に満たされる', async () => {
    mockCounts({ stock: 5, stockMemo: 5, feedback: 1 }, { level: 5, longestStreak: 7 })

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    // first_stock, watchlist_5, memo_5, first_feedback, streak_3, streak_7, level_5
    expect(json.data.unlockedCount).toBe(7)
  })

  it('既存ユーザーマイグレーション: notifiedTitleIdsがnullなら獲得済みを自動登録', async () => {
    mockCounts({ stock: 1 }, { notifiedTitleIds: null })
    prismaMock.userGamification.update.mockResolvedValue({} as never)

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    expect(prismaMock.userGamification.update).toHaveBeenCalledWith({
      where: { userId: expect.any(String) },
      data: { notifiedTitleIds: ['first_stock'] },
    })
    expect(json.data.notifiedTitleIds).toEqual(['first_stock'])
  })

  it('notifiedTitleIdsが既存の場合はそのまま返す', async () => {
    mockCounts({ stock: 1 }, { notifiedTitleIds: ['first_stock'] })

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    expect(prismaMock.userGamification.update).not.toHaveBeenCalled()
    expect(json.data.notifiedTitleIds).toEqual(['first_stock'])
  })
})

describe('PATCH /api/gamification/titles', () => {
  it('成功: 通知済みIDを更新', async () => {
    prismaMock.userGamification.findUnique.mockResolvedValue({ userId: 'test' } as never)
    prismaMock.userGamification.update.mockResolvedValue({} as never)

    const req = createRequest('PATCH', 'http://localhost:3000/api/gamification/titles', {
      titleIds: ['first_stock', 'watchlist_5'],
    })
    const res = await PATCH(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(prismaMock.userGamification.update).toHaveBeenCalledWith({
      where: { userId: expect.any(String) },
      data: { notifiedTitleIds: ['first_stock', 'watchlist_5'] },
    })
  })

  it('不正なtitleIdsで400エラー', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/gamification/titles', {
      titleIds: 'invalid',
    })
    const res = await PATCH(req)
    const json = await getJson(res)

    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('ゲーミフィケーション未初期化で404エラー', async () => {
    prismaMock.userGamification.findUnique.mockResolvedValue(null as never)

    const req = createRequest('PATCH', 'http://localhost:3000/api/gamification/titles', {
      titleIds: ['first_stock'],
    })
    const res = await PATCH(req)
    const json = await getJson(res)

    expect(res.status).toBe(404)
    expect(json.success).toBe(false)
  })
})
