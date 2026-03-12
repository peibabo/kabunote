import { describe, it, expect, vi } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockUser, mockSupabaseClient } from '../mocks/supabase'
import { createRequest, createParams } from '../helpers/apiTestHelper'
import { withAuth, withStock } from '@/lib/apiHandler'

describe('withAuth', () => {
  it('成功: 認証済みでハンドラーを実行', async () => {
    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    )
    const wrapped = withAuth(handler, 'テスト')

    const req = createRequest('GET', 'http://localhost:3000/api/test')
    const res = await wrapped(req)
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ user: mockUser })
    )
  })

  it('401: 未認証', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Not authenticated'),
    })
    const handler = vi.fn()
    const wrapped = withAuth(handler, 'テスト')

    const req = createRequest('GET', 'http://localhost:3000/api/test')
    const res = await wrapped(req)
    expect(res.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })

  it('500: ハンドラーがエラーをthrow', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('Internal'))
    const wrapped = withAuth(handler, 'テスト')

    const req = createRequest('GET', 'http://localhost:3000/api/test')
    const res = await wrapped(req)
    expect(res.status).toBe(500)
  })
})

describe('withStock', () => {
  it('成功: stockIdを解決してハンドラーを実行', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)

    const handler = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    )
    const wrapped = withStock(handler, 'テスト')

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/memo')
    const res = await wrapped(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ stockId: 'stock-uuid-1' })
    )
  })

  it('404: 銘柄が見つからない', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const handler = vi.fn()
    const wrapped = withStock(handler, 'テスト')

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-9999/memo')
    const res = await wrapped(req, createParams({ stockId: 'stock-9999' }))
    expect(res.status).toBe(404)
    expect(handler).not.toHaveBeenCalled()
  })
})
