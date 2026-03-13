import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { notifyFeedback } from '@/lib/slack'

describe('notifyFeedback', () => {
  const originalEnv = process.env.SLACK_WEBHOOK_URL

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.SLACK_WEBHOOK_URL = originalEnv
    } else {
      delete process.env.SLACK_WEBHOOK_URL
    }
  })

  it('SLACK_WEBHOOK_URL未設定時はfetchを呼ばない', async () => {
    delete process.env.SLACK_WEBHOOK_URL
    await notifyFeedback('FEATURE_REQUEST', 'テスト')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('SLACK_WEBHOOK_URL設定時はWebhookを送信', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    await notifyFeedback('BUG_REPORT', '不具合内容')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://hooks.slack.com/test',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.blocks[0].text.text).toContain('🐛 不具合報告')
    expect(body.blocks[0].text.text).toContain('不具合内容')
  })

  it('fetch失敗時もエラーを投げない', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/test'
    fetchMock.mockRejectedValue(new Error('network error'))
    await expect(notifyFeedback('OTHER', 'テスト')).resolves.toBeUndefined()
  })
})
