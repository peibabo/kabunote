import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { DELETE } from '@/app/api/portfolio/realized/[tradeId]/route'

const mockTrade = {
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

describe('DELETE /api/portfolio/realized/[tradeId]', () => {
  beforeEach(() => {
    prismaMock.realizedTrade.findFirst.mockReset()
    prismaMock.realizedTrade.delete.mockReset()
    prismaMock.stockPosition.delete.mockReset()
    prismaMock.stockPosition.update.mockReset()
  })

  it('成功: 自分の確定損益を削除する', async () => {
    prismaMock.realizedTrade.findFirst.mockResolvedValue(mockTrade as never)
    prismaMock.realizedTrade.delete.mockResolvedValue(mockTrade as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/portfolio/realized/rt-1')
    const res = await DELETE(req, createParams({ tradeId: 'rt-1' }))
    const json = await getJson(res)

    expect(json.success).toBe(true)
    expect(prismaMock.realizedTrade.delete).toHaveBeenCalledWith({ where: { id: 'rt-1' } })
  })

  it('保有ポジションには一切触れない（株数を戻さない）', async () => {
    prismaMock.realizedTrade.findFirst.mockResolvedValue(mockTrade as never)
    prismaMock.realizedTrade.delete.mockResolvedValue(mockTrade as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/portfolio/realized/rt-1')
    await DELETE(req, createParams({ tradeId: 'rt-1' }))

    expect(prismaMock.stockPosition.delete).not.toHaveBeenCalled()
    expect(prismaMock.stockPosition.update).not.toHaveBeenCalled()
  })

  it('404: 存在しない / 他ユーザーの確定損益', async () => {
    prismaMock.realizedTrade.findFirst.mockResolvedValue(null)

    const req = createRequest('DELETE', 'http://localhost:3000/api/portfolio/realized/rt-999')
    const res = await DELETE(req, createParams({ tradeId: 'rt-999' }))

    expect(res.status).toBe(404)
    expect(prismaMock.realizedTrade.delete).not.toHaveBeenCalled()
  })
})
