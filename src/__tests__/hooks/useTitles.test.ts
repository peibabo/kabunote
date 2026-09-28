import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor, cleanup } from '@testing-library/react'
import { useTitles } from '@/hooks/auth/useTitles'
import { clearSharedFetchCache } from '@/hooks/util/useSharedFetch'
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'
import type { TitlesResponse } from '@/types/titles'
import type { XpGrantResult } from '@/types/gamification'

function titlesResponse(unlockedIds: string[], notifiedTitleIds: string[]): TitlesResponse {
  const ids = ['first_stock', 'watchlist_5']
  return {
    titles: ids.map(id => ({
      id, name: id, description: '', hint: '', category: 'stock', icon: '', rarity: 'common',
      unlocked: unlockedIds.includes(id),
    })),
    unlockedCount: unlockedIds.length,
    totalCount: ids.length,
    notifiedTitleIds,
  }
}

function mockFetch(...responses: TitlesResponse[]) {
  const queue = [...responses]
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      return Promise.resolve(new Response(JSON.stringify({ success: true })))
    }
    const data = queue.length > 1 ? queue.shift() : queue[0]
    return Promise.resolve(new Response(JSON.stringify({ success: true, data })))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const getCalls = (m: ReturnType<typeof mockFetch>) => m.mock.calls.filter(([, init]) => init?.method !== 'PATCH')
const patchCalls = (m: ReturnType<typeof mockFetch>) => m.mock.calls.filter(([, init]) => init?.method === 'PATCH')

describe('useTitles', () => {
  beforeEach(() => {
    clearSharedFetchCache()
  })

  afterEach(() => {
    // XP_GAINED のリスナーはマウント数で管理しているので、必ず全てアンマウントする
    cleanup()
    vi.unstubAllGlobals()
  })

  // KABUNOTE-WEB-V: LevelBadge・SlideOutMenu などが同時にマウントしても1回だけ取得する
  it('複数コンポーネントが同時に使っても取得は1回', async () => {
    const fetchMock = mockFetch(titlesResponse([], []))

    const a = renderHook(() => useTitles())
    renderHook(() => useTitles())
    renderHook(() => useTitles())

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    expect(getCalls(fetchMock)).toHaveLength(1)
    expect(a.result.current.titles?.totalCount).toBe(2)
  })

  it('XP獲得時はマウント数に関係なく1回だけ取り直す', async () => {
    const fetchMock = mockFetch(titlesResponse([], []), titlesResponse(['first_stock'], ['first_stock']))

    const a = renderHook(() => useTitles())
    renderHook(() => useTitles())
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    await act(async () => {
      emitAppEvent(APP_EVENTS.XP_GAINED, { xpEarned: 10 } as XpGrantResult)
    })

    await waitFor(() => expect(a.result.current.titles?.unlockedCount).toBe(1))
    expect(getCalls(fetchMock)).toHaveLength(2)
  })

  it('新規獲得称号の通知と通知済み更新は、マウント数に関係なく1回だけ', async () => {
    const fetchMock = mockFetch(titlesResponse(['first_stock'], []))
    const onUnlocked = vi.fn()
    window.addEventListener(APP_EVENTS.TITLE_UNLOCKED, onUnlocked)

    const a = renderHook(() => useTitles())
    renderHook(() => useTitles())
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    expect(onUnlocked).toHaveBeenCalledTimes(1)
    expect(patchCalls(fetchMock)).toHaveLength(1)
    expect(JSON.parse(patchCalls(fetchMock)[0][1]!.body as string)).toEqual({ titleIds: ['first_stock'] })
    window.removeEventListener(APP_EVENTS.TITLE_UNLOCKED, onUnlocked)
  })

  it('全てアンマウントした後はXP獲得で取得しない', async () => {
    const fetchMock = mockFetch(titlesResponse([], []))

    const a = renderHook(() => useTitles())
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    a.unmount()

    await act(async () => {
      emitAppEvent(APP_EVENTS.XP_GAINED, { xpEarned: 10 } as XpGrantResult)
    })
    expect(getCalls(fetchMock)).toHaveLength(1)
  })
})
