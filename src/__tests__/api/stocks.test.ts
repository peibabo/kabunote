import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { POST, DELETE } from '@/app/api/stocks/route'

describe('POST /api/stocks', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue(null)
    prismaMock.user.upsert.mockResolvedValue({ id: 'test-user-id-123' } as never)
    prismaMock.stock.aggregate.mockResolvedValue({ _max: { order: null } } as never)
    prismaMock.stock.create.mockResolvedValue({
      id: 'stock-uuid-1',
      symbol: '7203',
      name: 'トヨタ自動車',
    } as never)
  })

  it('成功: 新規銘柄を作成', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks', {
      symbol: '7203',
      name: 'トヨタ自動車',
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.symbol).toBe('7203')
    expect(json.existed).toBe(false)
  })

  it('400: symbol未指定', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks', {})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('重複: 既存の場合はexisted=trueを返す', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({
      id: 'stock-uuid-1',
      symbol: '7203',
      name: 'トヨタ自動車',
      sector: null,
      market: null,
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/stocks', {
      symbol: '7203',
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(json.existed).toBe(true)
  })

  it('ensureUser: ユーザーがない場合upsertが呼ばれる', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/stocks', {
      symbol: '9984',
    })
    await POST(req)
    expect(prismaMock.user.upsert).toHaveBeenCalled()
  })

  it('競合: create失敗時にfindFirstで再取得', async () => {
    prismaMock.stock.create.mockRejectedValue(new Error('Unique constraint'))
    prismaMock.stock.findFirst
      .mockResolvedValueOnce(null) // 最初のチェック
      .mockResolvedValueOnce({ id: 'stock-uuid-2', symbol: '9984' } as never) // 再取得

    const req = createRequest('POST', 'http://localhost:3000/api/stocks', {
      symbol: '9984',
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(json.existed).toBe(true)
  })
})

describe('DELETE /api/stocks', () => {
  it('成功: 銘柄を削除', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stock.delete.mockResolvedValue({} as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks', {
      symbol: '7203',
    })
    const res = await DELETE(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.stock.delete).toHaveBeenCalledWith({ where: { id: 'stock-uuid-1' } })
  })

  it('400: symbol未指定', async () => {
    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks', {})
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('既に削除済みの場合もsuccess', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks', {
      symbol: '7203',
    })
    const res = await DELETE(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
