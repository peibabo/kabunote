import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAppEvent } from '@/hooks/util/useAppEvent'
import { APP_EVENTS, emitAppEvent } from '@/lib/appEvents'

describe('useAppEvent', () => {
  it('イベント発火時に handler が detail 付きで呼ばれる', () => {
    const handler = vi.fn()
    renderHook(() => useAppEvent(APP_EVENTS.DB_TAG_UPDATE, handler))

    act(() => {
      emitAppEvent(APP_EVENTS.DB_TAG_UPDATE, { symbol: '7203', tags: [] })
    })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ symbol: '7203', tags: [] })
  })

  it('アンマウント後は呼ばれない', () => {
    const handler = vi.fn()
    const { unmount } = renderHook(() => useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, handler))

    unmount()
    act(() => {
      emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('enabled が false の間は登録されない', () => {
    const handler = vi.fn()
    const { rerender } = renderHook(
      ({ enabled }) => useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, handler, { enabled }),
      { initialProps: { enabled: false } }
    )

    act(() => {
      emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)
    })
    expect(handler).not.toHaveBeenCalled()

    // enabled を true にすると購読が始まる
    rerender({ enabled: true })
    act(() => {
      emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)
    })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('handler を毎レンダー新しく渡してもリスナーは再登録されず最新版が呼ばれる', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const first = vi.fn()
    const second = vi.fn()

    const { rerender } = renderHook(
      ({ handler }) => useAppEvent(APP_EVENTS.SNAPSHOT_CREATED, handler),
      { initialProps: { handler: first } }
    )
    const registrations = addSpy.mock.calls.filter(
      ([name]) => name === APP_EVENTS.SNAPSHOT_CREATED
    ).length

    rerender({ handler: second })

    // 再登録されていない
    expect(
      addSpy.mock.calls.filter(([name]) => name === APP_EVENTS.SNAPSHOT_CREATED).length
    ).toBe(registrations)

    act(() => {
      emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)
    })

    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)

    addSpy.mockRestore()
  })
})
