import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { PATCH } from '@/app/api/portfolio/snapshot/[id]/route'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'

const USER_ID = 'test-user-id-123'

function pastSnapshot(overrides?: Record<string, unknown>) {
  return {
    id: 'snap-1',
    userId: USER_ID,
    snapshotDate: new Date('2024-06-15T00:00:00.000Z'),
    totalInvestment: '150000',
    totalValue: '200000',
    profitLoss: '50000',
    cashAmount: '500000',
    netAssets: '700000',
    stockSnapshots: [
      {
        id: 'ss-1',
        stockId: 'stock-1',
        symbol: '7203',
        currentPrice: '2000',
        shares: 100,
        value: '200000',
        cost: '150000',
      },
    ],
    ...overrides,
  }
}

describe('PATCH /api/portfolio/snapshot/[id]', () => {
  beforeEach(() => {
    prismaMock.portfolioSnapshot.findUnique.mockReset()
    prismaMock.stockPriceSnapshot.update.mockReset()
    prismaMock.portfolioSnapshot.update.mockReset()
    prismaMock.stockPriceSnapshot.update.mockResolvedValue({} as never)
    prismaMock.portfolioSnapshot.update.mockResolvedValue({} as never)
  })

  it('成功: 個別株価を修正し、集計値が再計算される', async () => {
    prismaMock.portfolioSnapshot.findUnique.mockResolvedValue(pastSnapshot() as never)

    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [{ stockId: 'stock-1', currentPrice: 2500 }],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    // value = 2500 * 100 = 250000
    expect(json.data.totalValue).toBe(250000)
    expect(json.data.profitLoss).toBe(100000)   // 250000 - 150000
    expect(json.data.netAssets).toBe(750000)     // 250000 + 500000(cash)
    expect(json.data.stockSnapshots[0].currentPrice).toBe(2500)
    expect(json.data.stockSnapshots[0].value).toBe(250000)
    // 該当行とスナップショット本体が更新される
    expect(prismaMock.stockPriceSnapshot.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ss-1' },
        data: { currentPrice: 2500, value: 250000 },
      })
    )
    expect(prismaMock.portfolioSnapshot.update).toHaveBeenCalled()
  })

  it('404: 存在しないスナップショット', async () => {
    prismaMock.portfolioSnapshot.findUnique.mockResolvedValue(null as never)

    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/none', {
      stockPrices: [{ stockId: 'stock-1', currentPrice: 2500 }],
    })
    const res = await PATCH(req, createParams({ id: 'none' }))
    expect(res.status).toBe(404)
  })

  it('404: 他ユーザーのスナップショット', async () => {
    prismaMock.portfolioSnapshot.findUnique.mockResolvedValue(
      pastSnapshot({ userId: 'other-user' }) as never
    )

    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [{ stockId: 'stock-1', currentPrice: 2500 }],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    expect(res.status).toBe(404)
  })

  it('400: 当日分のスナップショットは修正不可', async () => {
    prismaMock.portfolioSnapshot.findUnique.mockResolvedValue(
      pastSnapshot({ snapshotDate: dateStrToUTCMidnight(getTodayJST()) }) as never
    )

    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [{ stockId: 'stock-1', currentPrice: 2500 }],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    expect(res.status).toBe(400)
  })

  it('404: 対象銘柄がスナップショットに存在しない', async () => {
    prismaMock.portfolioSnapshot.findUnique.mockResolvedValue(pastSnapshot() as never)

    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [{ stockId: 'stock-999', currentPrice: 2500 }],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    expect(res.status).toBe(404)
  })

  it('400: 株価が0以下', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [{ stockId: 'stock-1', currentPrice: 0 }],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    expect(res.status).toBe(400)
  })

  it('400: 株価がNaN/Infinity', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [{ stockId: 'stock-1', currentPrice: Infinity }],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    expect(res.status).toBe(400)
  })

  it('400: stockPricesが空配列', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/portfolio/snapshot/snap-1', {
      stockPrices: [],
    })
    const res = await PATCH(req, createParams({ id: 'snap-1' }))
    expect(res.status).toBe(400)
  })
})
