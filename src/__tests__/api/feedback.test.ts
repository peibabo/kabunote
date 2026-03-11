import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { POST } from '@/app/api/feedback/route'

beforeEach(() => {
  prismaMock.feedback.create.mockReset()
})

describe('POST /api/feedback', () => {
  it('成功: フィードバックを送信', async () => {
    prismaMock.feedback.create.mockResolvedValue({
      id: 'fb1',
      userId: 'test-user-id',
      category: 'FEATURE_REQUEST',
      content: 'テスト内容',
      createdAt: new Date(),
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
      category: 'FEATURE_REQUEST',
      content: 'テスト内容',
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prismaMock.feedback.create).toHaveBeenCalledWith({
      data: {
        userId: 'test-user-id-123',
        category: 'FEATURE_REQUEST',
        content: 'テスト内容',
      },
    })
  })

  it('400: カテゴリなし', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
      content: 'テスト',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: 無効なカテゴリ', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
      category: 'INVALID',
      content: 'テスト',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: 内容が空', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
      category: 'BUG_REPORT',
      content: '',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: 内容がスペースのみ', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
      category: 'BUG_REPORT',
      content: '   ',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: 1000文字超過', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
      category: 'OTHER',
      content: 'あ'.repeat(1001),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('成功: 全カテゴリで送信可能', async () => {
    prismaMock.feedback.create.mockResolvedValue({} as never)

    for (const category of ['FEATURE_REQUEST', 'IMPROVEMENT', 'BUG_REPORT', 'OTHER']) {
      const req = createRequest('POST', 'http://localhost:3000/api/feedback', {
        category,
        content: 'テスト',
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
    }
  })
})
