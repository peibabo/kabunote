import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, POST } from '@/app/api/portfolio/snapshot/backfill/route'
import { GET as GET_MISSING } from '@/app/api/portfolio/snapshot/missing/route'

const BASE = 'http://localhost:3000/api/portfolio/snapshot/backfill'

// 「今日」を 2026-11-20（金, JST 12:00）に固定
const NOW = new Date('2026-11-20T03:00:00.000Z')

function stockRow(overrides?: Record<string, unknown>) {
  return {
    id: 'stock-1',
    symbol: '7203',
    name: 'トヨタ自動車',
    prices: [{ currentPrice: '3000' }],
    positions: [
      { id: 'pos-1', shares: 50, purchasePrice: '2000', purchaseDate: '2026-11-02', taxRate: '0.20315', createdAt: new Date('2026-11-02T00:00:00Z') },
    ],
    // 11/18 に 50株売却（その前は 100株）
    realizedTrades: [
      { id: 't1', sellDate: '2026-11-18', costBasis: '2000', taxRate: '0.20315', consumedLots: [{ shares: 50, purchaseDate: '2026-11-02' }] },
    ],
    ...overrides,
  }
}

function snapshotRow(date: string, price: string | null, cash: string) {
  return {
    id: `snap-${date}`,
    snapshotDate: new Date(`${date}T00:00:00.000Z`),
    cashAmount: cash,
    stockSnapshots: [{ stockId: 'stock-1', currentPrice: price }],
  }
}

/** 直前（lt）・直後（gt）の記録を返し分ける */
function mockNeighbors(prev: unknown, next: unknown) {
  prismaMock.portfolioSnapshot.findFirst.mockImplementation((args: { where?: { snapshotDate?: { lt?: Date; gt?: Date } } }) => {
    if (args?.where?.snapshotDate?.lt) return Promise.resolve(prev) as never
    if (args?.where?.snapshotDate?.gt) return Promise.resolve(next) as never
    return Promise.resolve(null) as never
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  prismaMock.portfolioSnapshot.findUnique.mockReset()
  prismaMock.portfolioSnapshot.findFirst.mockReset()
  prismaMock.portfolioSnapshot.findMany.mockReset()
  prismaMock.portfolioSnapshot.create.mockReset()
  prismaMock.stockPriceSnapshot.createMany.mockReset()
  prismaMock.stock.findMany.mockReset()
  prismaMock.user.findUnique.mockReset()
  prismaMock.xpActivityLog.create.mockReset()

  prismaMock.portfolioSnapshot.findUnique.mockResolvedValue(null as never)
  prismaMock.stock.findMany.mockResolvedValue([stockRow()] as never)
  prismaMock.user.findUnique.mockResolvedValue({ cashAmount: '900000' } as never)
  mockNeighbors(snapshotRow('2026-11-13', '2500', '400000'), snapshotRow('2026-11-19', '2700', '450000'))
  prismaMock.portfolioSnapshot.create.mockResolvedValue({ id: 'snap-new' } as never)
  prismaMock.stockPriceSnapshot.createMany.mockResolvedValue({ count: 1 } as never)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('GET /api/portfolio/snapshot/backfill', () => {
  it('売却前の日は売却した株も含めて保有を再現し、直前の記録の株価・現金を初期値にする', async () => {
    const res = await GET(createRequest('GET', `${BASE}?date=2026-11-16`))
    const json = await getJson(res)
    expect(res.status).toBe(200)
    expect(json.data.stocks).toEqual([
      { stockId: 'stock-1', symbol: '7203', name: 'トヨタ自動車', shares: 100, cost: 200000, suggestedPrice: 2500 },
    ])
    expect(json.data.suggestedCash).toBe(400000)
  })

  it('直前の記録がなければ直後の記録の株価・今の現金を使う', async () => {
    mockNeighbors(null, snapshotRow('2026-11-19', '2700', '450000'))
    const json = await getJson(await GET(createRequest('GET', `${BASE}?date=2026-11-16`)))
    expect(json.data.stocks[0].suggestedPrice).toBe(2700)
    expect(json.data.suggestedCash).toBe(900000)
  })

  it('前後の記録がなければ今の株価を使う', async () => {
    mockNeighbors(null, null)
    const json = await getJson(await GET(createRequest('GET', `${BASE}?date=2026-11-16`)))
    expect(json.data.stocks[0].suggestedPrice).toBe(3000)
  })

  it.each([
    ['今日', '2026-11-20'],
    ['未来', '2026-11-24'],
    ['休業日', '2026-11-15'],
    ['形式不正', 'abc'],
  ])('400: %s', async (_label, date) => {
    const res = await GET(createRequest('GET', `${BASE}?date=${date}`))
    expect(res.status).toBe(400)
  })

  it('409: 記録済みの日', async () => {
    prismaMock.portfolioSnapshot.findUnique.mockResolvedValue({ id: 'snap-x' } as never)
    const res = await GET(createRequest('GET', `${BASE}?date=2026-11-16`))
    expect(res.status).toBe(409)
  })

  it('400: その日に保有がない（取得日より前）', async () => {
    const res = await GET(createRequest('GET', `${BASE}?date=2026-10-30`))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/portfolio/snapshot/backfill', () => {
  it('入力した株価・現金で作成し、XP は付けない', async () => {
    const res = await POST(createRequest('POST', BASE, {
      date: '2026-11-16',
      stockPrices: [{ stockId: 'stock-1', currentPrice: 2600 }],
      cashAmount: 300000,
    }))
    const json = await getJson(res)
    expect(res.status).toBe(200)
    expect(json.data.totalValue).toBe(260000)
    expect(json.data.totalInvestment).toBe(200000)
    expect(json.data.profitLoss).toBe(60000)
    expect(json.data.netAssets).toBe(560000)

    const createArg = prismaMock.portfolioSnapshot.create.mock.calls[0][0] as { data: { snapshotDate: Date } }
    expect(createArg.data.snapshotDate.toISOString()).toBe('2026-11-16T00:00:00.000Z')
    const rows = (prismaMock.stockPriceSnapshot.createMany.mock.calls[0][0] as { data: { shares: number; currentPrice: number }[] }).data
    expect(rows).toEqual([expect.objectContaining({ shares: 100, currentPrice: 2600, value: 260000, cost: 200000 })])
    expect(prismaMock.xpActivityLog.create).not.toHaveBeenCalled()
  })

  it('株価・現金を省略すると初期値で作成する', async () => {
    const json = await getJson(await POST(createRequest('POST', BASE, { date: '2026-11-16' })))
    expect(json.data.totalValue).toBe(250000)
    expect(json.data.cashAmount).toBe(400000)
  })

  it('400: 株価が不正', async () => {
    const res = await POST(createRequest('POST', BASE, {
      date: '2026-11-16',
      stockPrices: [{ stockId: 'stock-1', currentPrice: 0 }],
    }))
    expect(res.status).toBe(400)
  })

  it('400: 現金が負', async () => {
    const res = await POST(createRequest('POST', BASE, { date: '2026-11-16', cashAmount: -1 }))
    expect(res.status).toBe(400)
  })

  it('400: 現金が上限（1000億円）を超える', async () => {
    const res = await POST(createRequest('POST', BASE, { date: '2026-11-16', cashAmount: 1e20 }))
    expect(res.status).toBe(400)
    expect(prismaMock.portfolioSnapshot.create).not.toHaveBeenCalled()
  })

  it('400: 株価が決まらない銘柄がある（入力なし・前後の記録も今の株価もない）', async () => {
    mockNeighbors(null, null)
    prismaMock.stock.findMany.mockResolvedValue([stockRow({ prices: [] })] as never)
    const res = await POST(createRequest('POST', BASE, { date: '2026-11-16', stockPrices: [] }))
    const json = await getJson(res)
    expect(res.status).toBe(400)
    expect(json.message).toContain('7203')
    expect(prismaMock.portfolioSnapshot.create).not.toHaveBeenCalled()
  })

  it('株価の初期値がなくても、入力すれば作成できる', async () => {
    mockNeighbors(null, null)
    prismaMock.stock.findMany.mockResolvedValue([stockRow({ prices: [] })] as never)
    const res = await POST(createRequest('POST', BASE, {
      date: '2026-11-16',
      stockPrices: [{ stockId: 'stock-1', currentPrice: 2400 }],
    }))
    expect(res.status).toBe(200)
  })

  it('400: その日に保有していない銘柄の株価', async () => {
    const res = await POST(createRequest('POST', BASE, {
      date: '2026-11-16',
      stockPrices: [{ stockId: 'other', currentPrice: 100 }],
    }))
    expect(res.status).toBe(400)
  })

  it('409: 同時に作成されて一意制約に当たった', async () => {
    prismaMock.portfolioSnapshot.create.mockRejectedValue(Object.assign(new Error('unique'), { code: 'P2002' }))
    const res = await POST(createRequest('POST', BASE, { date: '2026-11-16' }))
    expect(res.status).toBe(409)
  })
})

describe('GET /api/portfolio/snapshot/missing', () => {
  const MISSING_URL = 'http://localhost:3000/api/portfolio/snapshot/missing'

  it('初回記録日以降の未記録の営業日を新しい順で返す', async () => {
    prismaMock.portfolioSnapshot.findFirst.mockResolvedValue({ snapshotDate: new Date('2026-11-13T00:00:00Z') } as never)
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      { snapshotDate: new Date('2026-11-13T00:00:00Z') },
      { snapshotDate: new Date('2026-11-17T00:00:00Z') },
      { snapshotDate: new Date('2026-11-20T00:00:00Z') },
    ] as never)
    const json = await getJson(await GET_MISSING(createRequest('GET', 'http://localhost:3000/api/portfolio/snapshot/missing')))
    expect(json.data.missingDates).toEqual(['2026-11-19', '2026-11-18', '2026-11-16'])
  })

  it('何も保有していなかった日は含めない（後から追加できないため）', async () => {
    prismaMock.portfolioSnapshot.findFirst.mockResolvedValue({ snapshotDate: new Date('2026-11-13T00:00:00Z') } as never)
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([
      { snapshotDate: new Date('2026-11-13T00:00:00Z') },
    ] as never)
    // 11/16〜11/17 は保有なし、11/18 に買い直した
    prismaMock.stock.findMany.mockResolvedValue([stockRow({
      positions: [{ id: 'pos-1', shares: 100, purchasePrice: '2000', purchaseDate: '2026-11-18', taxRate: '0.20315', createdAt: new Date('2026-11-18T00:00:00Z') }],
      realizedTrades: [],
    })] as never)
    const json = await getJson(await GET_MISSING(createRequest('GET', MISSING_URL)))
    expect(json.data.missingDates).toEqual(['2026-11-19', '2026-11-18'])
  })

  it('記録が1件もなければ空', async () => {
    prismaMock.portfolioSnapshot.findFirst.mockResolvedValue(null as never)
    prismaMock.portfolioSnapshot.findMany.mockResolvedValue([] as never)
    const json = await getJson(await GET_MISSING(createRequest('GET', 'http://localhost:3000/api/portfolio/snapshot/missing')))
    expect(json.data.missingDates).toEqual([])
  })
})
