import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { POST, GET } from '@/app/api/stocks/[stockId]/position/sell/route'

const lot = (overrides?: Partial<{ id: string; shares: number; purchasePrice: number; purchaseDate: string; taxRate: number; createdAt: Date }>) => ({
  id: 'pos-1',
  stockId: 'stock-uuid-1',
  shares: 100,
  purchasePrice: 1500,
  purchaseDate: '2024-01-01',
  memo: null,
  taxRate: 0.20315,
  createdAt: new Date('2024-01-01'),
  ...overrides,
})

const createdTrade = {
  id: 'rt-1',
  stockId: 'stock-uuid-1',
  soldShares: 100,
  sellPrice: 1600,
  costBasis: 1500,
  sellDate: '2026-06-01',
  realizedPL: 10000,
  taxRate: 0.20315,
  consumedLots: [{ shares: 100, purchaseDate: '2024-01-01' }],
  memo: null,
  createdAt: new Date('2026-06-01'),
}

describe('POST /api/stocks/[stockId]/position/sell', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.realizedTrade.create.mockResolvedValue(createdTrade as never)
  })

  it('成功: 全株売却でロット削除・確定損益を返す', async () => {
    prismaMock.stockPosition.findMany
      .mockResolvedValueOnce([lot()] as never) // 売却前の取得
      .mockResolvedValueOnce([] as never)      // 消し込み後
    prismaMock.stockPosition.delete.mockResolvedValue(lot() as never)
    prismaMock.realizedTrade.create.mockResolvedValue(createdTrade as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 100, sellPrice: 1600, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.trade.realizedPL).toBe(10000)
    expect(json.data.trade.consumedLots).toEqual([{ shares: 100, purchaseDate: '2024-01-01' }])
    expect(json.data.positions).toEqual([])
    expect(prismaMock.stockPosition.delete).toHaveBeenCalledWith({ where: { id: 'pos-1' } })
    // 消し込んだロットの取得日が内訳として保存される
    expect(prismaMock.realizedTrade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ consumedLots: [{ shares: 100, purchaseDate: '2024-01-01' }] }),
      })
    )
  })

  it('成功: 複数ロットをまたぐ売却で取得日内訳を保全', async () => {
    const lotA = lot({ id: 'pos-1', shares: 60, purchaseDate: '2024-01-01', createdAt: new Date('2024-01-01') })
    const lotB = lot({ id: 'pos-2', shares: 40, purchaseDate: '2025-03-10', createdAt: new Date('2025-03-10') })
    prismaMock.stockPosition.findMany
      .mockResolvedValueOnce([lotA, lotB] as never) // 売却前
      .mockResolvedValueOnce([] as never)           // 消し込み後
    prismaMock.stockPosition.delete.mockResolvedValue(lotA as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 100, sellPrice: 1600, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(200)
    expect(prismaMock.realizedTrade.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          consumedLots: [
            { shares: 60, purchaseDate: '2024-01-01' },
            { shares: 40, purchaseDate: '2025-03-10' },
          ],
        }),
      })
    )
  })

  it('成功: 一部売却でロット株数を減算', async () => {
    prismaMock.stockPosition.findMany
      .mockResolvedValueOnce([lot({ shares: 100 })] as never)
      .mockResolvedValueOnce([lot({ shares: 70 })] as never)
    prismaMock.stockPosition.update.mockResolvedValue(lot({ shares: 70 }) as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 30, sellPrice: 1600, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stockPosition.update).toHaveBeenCalledWith({ where: { id: 'pos-1' }, data: { shares: 70 } })
  })

  it('400: 保有株数を超える売却', async () => {
    prismaMock.stockPosition.findMany.mockResolvedValueOnce([lot({ shares: 50 })] as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 100, sellPrice: 1600, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('400: ポジションが無い', async () => {
    prismaMock.stockPosition.findMany.mockResolvedValueOnce([] as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 100, sellPrice: 1600, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('400: soldShares<=0', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 0, sellPrice: 1600, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })

  it('400: sellPrice<=0', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks/stock-7203/position/sell', {
      soldShares: 100, sellPrice: -1, sellDate: '2026-06-01',
    })
    const res = await POST(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/stocks/[stockId]/position/sell', () => {
  it('成功: 確定損益履歴を取得', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1', symbol: '7203' } as never)
    prismaMock.realizedTrade.findMany.mockResolvedValue([createdTrade] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/position/sell')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].symbol).toBe('7203')
  })

  it('銘柄未発見時は空配列', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-9999/position/sell')
    const res = await GET(req, createParams({ stockId: 'stock-9999' }))
    const json = await getJson(res)
    expect(json.data).toEqual([])
  })
})
