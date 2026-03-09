import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'

// supabaseAdmin モック（route.ts内でcreateClientを直接呼んでいる）
const mockDeleteUser = vi.fn()
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
      },
    },
  }),
}))

import { DELETE } from '@/app/api/account/delete/route'

describe('DELETE /api/account/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功: DB削除+Auth削除 → 200', async () => {
    prismaMock.user.delete.mockResolvedValue({} as never)
    mockDeleteUser.mockResolvedValue({ data: {}, error: null })

    const req = createRequest('DELETE', 'http://localhost:3000/api/account/delete')
    const res = await DELETE(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.message).toBe('アカウントを削除しました')
    expect(prismaMock.user.delete).toHaveBeenCalledWith({
      where: { id: 'test-user-id-123' },
    })
    expect(mockDeleteUser).toHaveBeenCalledWith('test-user-id-123')
  })

  it('成功: DB削除OK、Auth削除失敗 → 200（警告ログ）', async () => {
    prismaMock.user.delete.mockResolvedValue({} as never)
    mockDeleteUser.mockRejectedValue(new Error('Auth error'))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const req = createRequest('DELETE', 'http://localhost:3000/api/account/delete')
    const res = await DELETE(req)
    const json = await getJson(res)

    expect(res.status).toBe(200)
    expect(json.message).toBe('アカウントを削除しました')
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('失敗: DB削除失敗 → 500', async () => {
    prismaMock.user.delete.mockRejectedValue(new Error('DB error'))

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const req = createRequest('DELETE', 'http://localhost:3000/api/account/delete')
    const res = await DELETE(req)

    expect(res.status).toBe(500)

    errorSpy.mockRestore()
  })
})
