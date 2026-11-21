import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { POST } from '@/app/api/onboarding/events/route'
import { resetRateLimitStore } from '@/lib/rateLimit'

const URL = 'http://localhost:3000/api/onboarding/events'

beforeEach(() => {
  prismaMock.onboardingEvent.create.mockReset()
  prismaMock.onboardingEvent.create.mockResolvedValue({} as never)
  resetRateLimitStore()
})

describe('POST /api/onboarding/events', () => {
  it('成功: イベントを記録', async () => {
    const res = await POST(createRequest('POST', URL, { event: 'step_view', step: 1 }))
    const json = await getJson(res)
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(prismaMock.onboardingEvent.create).toHaveBeenCalledWith({
      data: { userId: 'test-user-id-123', event: 'step_view', step: 1 },
    })
  })

  it.each([
    ['未知のイベント', { event: 'hacked', step: 0 }],
    ['イベントなし', { step: 0 }],
    ['ステップが負数', { event: 'shown', step: -1 }],
    ['ステップが小数', { event: 'shown', step: 1.5 }],
    ['ステップが大きすぎる', { event: 'shown', step: 100 }],
    ['ステップが文字列', { event: 'shown', step: '1' }],
  ])('400: %s', async (_, body) => {
    const res = await POST(createRequest('POST', URL, body))
    expect(res.status).toBe(400)
    expect(prismaMock.onboardingEvent.create).not.toHaveBeenCalled()
  })
})
