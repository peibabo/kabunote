import { describe, it, expect, vi, afterEach } from 'vitest'
import { APP_EVENTS, emitAppEvent } from '@/lib/appEvents'

describe('APP_EVENTS', () => {
  it('イベント名が重複していない', () => {
    const names = Object.values(APP_EVENTS)
    expect(new Set(names).size).toBe(names.length)
  })

  it('DB更新系のイベント名は kabunote-db- 接頭辞を持つ', () => {
    const dbEvents = Object.entries(APP_EVENTS)
      .filter(([key]) => key.startsWith('DB_'))
      .map(([, value]) => value)

    expect(dbEvents.length).toBeGreaterThan(0)
    for (const name of dbEvents) {
      expect(name).toMatch(/^kabunote-db-/)
    }
  })
})

describe('emitAppEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('detail付きイベントを CustomEvent として発火する', () => {
    const handler = vi.fn()
    window.addEventListener(APP_EVENTS.DB_TAG_UPDATE, handler)

    emitAppEvent(APP_EVENTS.DB_TAG_UPDATE, { symbol: '7203', tags: [] })

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0][0] as CustomEvent
    expect(event.detail).toEqual({ symbol: '7203', tags: [] })

    window.removeEventListener(APP_EVENTS.DB_TAG_UPDATE, handler)
  })

  it('detailを持たないイベントは detail が undefined になる', () => {
    const handler = vi.fn()
    window.addEventListener(APP_EVENTS.SNAPSHOT_CREATED, handler)

    emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)

    expect(handler).toHaveBeenCalledTimes(1)
    const event = handler.mock.calls[0][0] as CustomEvent
    expect(event.detail).toBeUndefined()

    window.removeEventListener(APP_EVENTS.SNAPSHOT_CREATED, handler)
  })

  it('リスナーが登録されていなくてもエラーにならない', () => {
    expect(() => emitAppEvent(APP_EVENTS.COOKIE_CONSENT_CHANGE)).not.toThrow()
  })
})
