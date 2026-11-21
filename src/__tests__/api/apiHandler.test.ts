import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockUser, mockSupabaseClient } from '../mocks/supabase'
import { createRequest, createParams } from '../helpers/apiTestHelper'
import { withAuth, withStock } from '@/lib/apiHandler'
import { resetRateLimitStore } from '@/lib/rateLimit'
import { resetEnsuredAppUsers } from '@/lib/ensureAppUser'

beforeEach(() => {
  resetRateLimitStore()
  resetEnsuredAppUsers()
  prismaMock.user.createMany.mockReset()
  prismaMock.user.createMany.mockResolvedValue({ count: 0 } as never)
})

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

  it('ハンドラーより先に app_users を保証する（sync-user 前の書き込みで外部キー違反にしない）', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }))
    const wrapped = withAuth(handler, 'テスト')

    await wrapped(createRequest('POST', 'http://localhost:3000/api/test'))
    expect(prismaMock.user.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ id: mockUser.id, email: mockUser.email })],
        skipDuplicates: true,
      })
    )
    expect(prismaMock.user.createMany.mock.invocationCallOrder[0])
      .toBeLessThan(handler.mock.invocationCallOrder[0])
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
