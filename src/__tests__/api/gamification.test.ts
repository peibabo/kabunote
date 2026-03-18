import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/gamification/route'
import { POST } from '@/app/api/gamification/xp/route'
import { GET as GET_ACTIVITY } from '@/app/api/gamification/activity/route'

const today = new Date().toISOString().slice(0, 10)

const mockGamification = {
  id: 'gam-1',
  userId: 'test-user-id',
  totalXp: 500,
  level: 3,
  dailyXp: 30,
  dailyXpDate: new Date(today),
  currentStreak: 5,
  longestStreak: 10,
  lastActiveDate: new Date(today),
  createdAt: new Date(),
  updatedAt: new Date(),
}

beforeEach(() => {
  prismaMock.userGamification.findUnique.mockReset()
  prismaMock.userGamification.create.mockReset()
  prismaMock.userGamification.update.mockReset()
  prismaMock.userGamification.upsert.mockReset()
  prismaMock.xpActivityLog.findFirst.mockReset()
  prismaMock.xpActivityLog.create.mockReset()
  prismaMock.xpActivityLog.findMany.mockReset()
})

describe('GET /api/gamification', () => {
  it('成功: ゲーミフィケーション状態を取得', async () => {
    prismaMock.userGamification.findUnique.mockResolvedValue(mockGamification as never)

    const req = createRequest('GET', 'http://localhost:3000/api/gamification')
    const res = await GET(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.totalXp).toBe(500)
    expect(json.data.level).toBe(3)
    expect(json.data.dailyXp).toBe(30)
    expect(json.data.currentStreak).toBe(5)
    expect(json.data.levelName).toBe('勉強中の投資家')
  })

  it('初回: 自動作成', async () => {
    prismaMock.userGamification.findUnique.mockResolvedValue(null)
    prismaMock.userGamification.create.mockResolvedValue({
      ...mockGamification,
      totalXp: 0,
      level: 1,
      dailyXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    } as never)

    const req = createRequest('GET', 'http://localhost:3000/api/gamification')
    const res = await GET(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.level).toBe(1)
    expect(json.data.levelName).toBe('見習い投資家')
  })
})

describe('POST /api/gamification/xp', () => {
  it('成功: XPを付与', async () => {
    const gamWithinLevel = {
      ...mockGamification,
      totalXp: 260,
      level: 3,
      dailyXp: 30,
    }
    prismaMock.userGamification.upsert.mockResolvedValue(gamWithinLevel as never)
    prismaMock.xpActivityLog.findFirst.mockResolvedValue(null)
    prismaMock.userGamification.update.mockResolvedValue({
      ...gamWithinLevel,
      totalXp: 275,
      dailyXp: 45,
    } as never)
    prismaMock.xpActivityLog.create.mockResolvedValue({} as never)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'STOCK_ADD',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.xpEarned).toBe(15)
    expect(json.data.leveledUp).toBe(false)
  })

  it('400: 無効なアクションタイプ', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'INVALID',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('日次上限到達時はXP付与されない', async () => {
    prismaMock.userGamification.upsert.mockResolvedValue({
      ...mockGamification,
      dailyXp: 100,
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'TAG_ADD',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.xpEarned).toBe(0)
    expect(json.data.dailyCapReached).toBe(true)
  })

  it('日次1回制限: MEMO_SAVEは当日2回目以降XP付与しない', async () => {
    prismaMock.userGamification.upsert.mockResolvedValue(mockGamification as never)
    prismaMock.xpActivityLog.findFirst.mockResolvedValue({ id: 'existing' } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'MEMO_SAVE',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.xpEarned).toBe(0)
  })

  it('レベルアップ時はleveledUp=true', async () => {
    // Lv2に到達する直前（99XP）から+15XPでLv2到達
    prismaMock.userGamification.upsert.mockResolvedValue({
      ...mockGamification,
      totalXp: 95,
      level: 1,
      dailyXp: 0,
    } as never)
    prismaMock.xpActivityLog.findFirst.mockResolvedValue(null)
    prismaMock.userGamification.update.mockResolvedValue({
      ...mockGamification,
      totalXp: 110,
      level: 2,
      dailyXp: 15,
    } as never)
    prismaMock.xpActivityLog.create.mockResolvedValue({} as never)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'STOCK_ADD',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data.leveledUp).toBe(true)
    expect(json.data.newLevel).toBe(2)
    expect(json.data.newLevelName).toBe('初心者投資家')
  })
})

describe('GET /api/gamification/activity', () => {
  it('成功: アクティビティログを取得', async () => {
    prismaMock.xpActivityLog.findMany.mockResolvedValue([
      { id: 'log-1', actionType: 'LOGIN', xpEarned: 10, description: 'ログイン', createdAt: new Date() },
      { id: 'log-2', actionType: 'STOCK_ADD', xpEarned: 15, description: '銘柄追加', createdAt: new Date() },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/gamification/activity')
    const res = await GET_ACTIVITY(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].actionType).toBe('LOGIN')
  })
})
