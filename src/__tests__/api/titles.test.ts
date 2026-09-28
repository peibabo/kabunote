import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PATCH } from '@/app/api/gamification/titles/route'

beforeEach(() => {
  prismaMock.$queryRaw.mockReset()
  prismaMock.userGamification.findUnique.mockReset()
  prismaMock.userGamification.update.mockReset()
  prismaMock.xpActivityLog.findMany.mockReset()
})

type CountKey =
  | 'stockCount' | 'memoCount' | 'tagCount' | 'distinctTagColorCount' | 'positionCount'
  | 'realizedTradeCount' | 'totalRealizedProfit' | 'dividendCount' | 'benefitCount'
  | 'eventCount' | 'nextActionCount' | 'snapshotCount' | 'feedbackCount' | 'stocksWithMemoCount'

function mockCounts(overrides: Partial<Record<CountKey, number>> = {}, gamificationOverrides: { notifiedTitleIds?: string[] | null; level?: number; longestStreak?: number } = {}) {
  const row: Record<CountKey, number> = {
    stockCount: 0, memoCount: 0, tagCount: 0, distinctTagColorCount: 0, positionCount: 0,
    realizedTradeCount: 0, totalRealizedProfit: 0, dividendCount: 0, benefitCount: 0,
    eventCount: 0, nextActionCount: 0, snapshotCount: 0, feedbackCount: 0, stocksWithMemoCount: 0,
    ...overrides,
  }
  // 集計はSQL1本（1行）で返る
  prismaMock.$queryRaw.mockResolvedValue([row] as never)
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
    expect(json.data.titles).toHaveLength(31)
    expect(json.data.totalCount).toBe(31)
    expect(json.data.unlockedCount).toBe(0)
    expect(json.data.notifiedTitleIds).toEqual([])
  })

  it('銘柄1個で「はじめの一歩」が獲得済み', async () => {
    mockCounts({ stockCount: 1 })

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    const firstStock = json.data.titles.find((t: { id: string }) => t.id === 'first_stock')
    expect(firstStock.unlocked).toBe(true)
    expect(json.data.unlockedCount).toBe(1)
    expect(json.data.notifiedTitleIds).toEqual([])
  })

  it('複数条件が同時に満たされる', async () => {
    mockCounts({ stockCount: 5, memoCount: 5, feedbackCount: 1 }, { level: 5, longestStreak: 7 })

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    const res = await GET(req)
    const json = await getJson(res)

    // first_stock, watchlist_5, memo_5, first_feedback, streak_3, streak_7, level_5
    expect(json.data.unlockedCount).toBe(7)
  })

  // KABUNOTE-WEB-V: 以前は count を約15本並列で投げていた
  it('集計はDB往復1回のSQLで取得する', async () => {
    mockCounts()

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/titles')
    await GET(req)

    expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1)
    expect(prismaMock.stock.count).not.toHaveBeenCalled()
  })

  it('全銘柄にメモがあるときだけ「全銘柄メモ達成」を獲得する', async () => {
    const allMemos = async () => {
      const res = await GET(createRequest('GET', 'http://localhost:3000/api/gamification/titles'))
      const json = await getJson(res)
      return json.data.titles.find((t: { id: string }) => t.id === 'all_memos').unlocked
    }

    mockCounts({ stockCount: 2, memoCount: 2, stocksWithMemoCount: 2 })
    expect(await allMemos()).toBe(true)

    mockCounts({ stockCount: 2, memoCount: 1, stocksWithMemoCount: 1 })
    expect(await allMemos()).toBe(false)
  })

  it('既存ユーザーマイグレーション: notifiedTitleIdsがnullなら獲得済みを自動登録', async () => {
    mockCounts({ stockCount: 1 }, { notifiedTitleIds: null })
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
    mockCounts({ stockCount: 1 }, { notifiedTitleIds: ['first_stock'] })

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
