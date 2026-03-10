import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, POST } from '@/app/api/onboarding/route'

describe('GET /api/onboarding', () => {
  it('成功: オンボーディング完了状態を取得', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      onboardingCompleted: true,
    } as never)

    const req = createRequest('GET', 'http://localhost:3000/api/onboarding')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.completed).toBe(true)
  })

  it('デフォルト: ユーザーなしの場合はfalse', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/onboarding')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.completed).toBe(false)
  })

  it('未完了の場合はfalse', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      onboardingCompleted: false,
    } as never)

    const req = createRequest('GET', 'http://localhost:3000/api/onboarding')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.completed).toBe(false)
  })
})

describe('POST /api/onboarding', () => {
  it('成功: オンボーディングを完了に更新', async () => {
    prismaMock.user.update.mockResolvedValue({
      onboardingCompleted: true,
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/onboarding', {
      completed: true,
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(json.completed).toBe(true)
  })

  it('成功: オンボーディングをリセット', async () => {
    prismaMock.user.update.mockResolvedValue({
      onboardingCompleted: false,
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/onboarding', {
      completed: false,
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(json.completed).toBe(false)
  })

  it('400: completedがbooleanでない', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/onboarding', {
      completed: 'yes',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: completedが未指定', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/onboarding', {})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
