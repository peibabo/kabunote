import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET } from '@/app/api/gamification/route'
import { POST } from '@/app/api/gamification/xp/route'
import { GET as GET_ACTIVITY } from '@/app/api/gamification/activity/route'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'

const today = getTodayJST()

const mockGamification = {
  id: 'gam-1',
  userId: 'test-user-id',
  totalXp: 500,
  level: 3,
  dailyXp: 30,
  dailyXpDate: dateStrToUTCMidnight(today),
  currentStreak: 5,
  longestStreak: 10,
  lastActiveDate: dateStrToUTCMidnight(today),
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

describe('POST /api/gamification/xp - 営業日ベースストリーク', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  /** 指定日時をモックし、その日付のGamification状態を返すヘルパー */
  function setupStreakTest(
    todayStr: string,
    lastActiveDateStr: string | null,
    currentStreak: number,
  ) {
    // todayStrをUTC基準でDateに変換（既存コードが new Date().toISOString().slice(0,10) を使用）
    vi.useFakeTimers()
    vi.setSystemTime(new Date(todayStr + 'T00:00:00.000Z'))

    const gam = {
      ...mockGamification,
      dailyXpDate: new Date(new Date().getTime() - 86400000), // isNewDay=true にする
      currentStreak,
      longestStreak: Math.max(currentStreak, 10),
      lastActiveDate: lastActiveDateStr ? new Date(lastActiveDateStr + 'T00:00:00.000Z') : null,
    }

    prismaMock.userGamification.upsert.mockResolvedValue(gam as never)
    prismaMock.xpActivityLog.findFirst.mockResolvedValue(null)
    prismaMock.userGamification.update.mockResolvedValue({
      ...gam,
      lastActiveDate: new Date(todayStr + 'T00:00:00.000Z'),
    } as never)
    prismaMock.xpActivityLog.create.mockResolvedValue({} as never)
  }

  it('金曜ログイン→月曜ログイン: ストリーク継続', async () => {
    // 2026/3/9 月曜にログイン、lastActiveは2026/3/6 金曜
    setupStreakTest('2026-03-09', '2026-03-06', 5)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'LOGIN',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    // updateが呼ばれた時のcurrentStreakを確認
    const updateCall = prismaMock.userGamification.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.currentStreak).toBe(6) // 5+1
  })

  it('金曜ログイン→土曜ログイン→月曜ログイン: ストリーク継続', async () => {
    // 2026/3/9 月曜にログイン、lastActiveは2026/3/7 土曜（金曜にもログインしていた）
    setupStreakTest('2026-03-09', '2026-03-07', 5)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'LOGIN',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    const updateCall = prismaMock.userGamification.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.currentStreak).toBe(6) // 5+1
  })

  it('木曜ログイン→月曜ログイン(金曜未ログイン): ストリークリセット', async () => {
    // 2026/3/9 月曜にログイン、lastActiveは2026/3/5 木曜（金曜にログインしていない）
    setupStreakTest('2026-03-09', '2026-03-05', 5)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'LOGIN',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    const updateCall = prismaMock.userGamification.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.currentStreak).toBe(1) // リセット
  })

  it('土曜にログイン: 非営業日なのでストリーク変更なし', async () => {
    // 2026/3/7 土曜にログイン、lastActiveは2026/3/6 金曜
    setupStreakTest('2026-03-07', '2026-03-06', 5)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'LOGIN',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    const updateCall = prismaMock.userGamification.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.currentStreak).toBe(5) // 変更なし
  })

  it('祝日跨ぎ: 2/10(火)→2/12(木)でストリーク継続（2/11建国記念の日）', async () => {
    // 2026/2/12 木曜にログイン、lastActiveは2026/2/10 火曜（2/11は祝日）
    setupStreakTest('2026-02-12', '2026-02-10', 3)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'LOGIN',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    const updateCall = prismaMock.userGamification.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.currentStreak).toBe(4) // 3+1
  })

  it('年末年始跨ぎ: 12/30→1/5でストリーク継続', async () => {
    // 2026/1/5 月曜にログイン、lastActiveは2025/12/30 火曜
    setupStreakTest('2026-01-05', '2025-12-30', 7)

    const req = createRequest('POST', 'http://localhost:3000/api/gamification/xp', {
      actionType: 'LOGIN',
    })
    const res = await POST(req)
    const json = await getJson(res)

    expect(json.success).toBe(true)
    const updateCall = prismaMock.userGamification.update.mock.calls[0]?.[0]
    expect(updateCall?.data?.currentStreak).toBe(8) // 7+1
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
