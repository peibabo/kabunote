import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockUser, mockSupabaseClient } from '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { POST } from '@/app/api/auth/sync-user/route'

describe('POST /api/auth/sync-user', () => {
  beforeEach(() => {
    prismaMock.user.upsert.mockResolvedValue({
      id: mockUser.id,
      email: 'test@example.com',
      name: 'Test User',
      picture: null,
      authProvider: 'google',
    })
  })

  it('成功: ユーザーを同期する', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/auth/sync-user', {
      id: mockUser.id,
      email: 'test@example.com',
      name: 'Test User',
      authProvider: 'google',
    })

    const res = await POST(req)
    const json = await getJson(res)
    expect(res.status).toBe(200)
    expect(json.id).toBe(mockUser.id)
  })

  it('403: ユーザーIDが不一致', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/auth/sync-user', {
      id: 'different-user-id',
      email: 'other@example.com',
      authProvider: 'google',
    })

    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('401: 未認証', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error('Not authenticated'),
    })

    const req = createRequest('POST', 'http://localhost:3000/api/auth/sync-user', {
      id: 'any-id',
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })
})
