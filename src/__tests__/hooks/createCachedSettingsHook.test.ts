import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { createCachedSettingsHook } from '@/hooks/util/createCachedSettingsHook'
import { APP_EVENTS } from '@/lib/appEvents'
import { toast } from '@/lib/toast'

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

const DEFAULT = [{ id: 'default', label: 'デフォルト', url: 'https://example.com', order: 0 }]
const SAVED = [{ id: 'saved', label: '保存済み', url: 'https://saved.example', order: 0 }]

function mockFetchOk(data: unknown) {
  return vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data }),
  })
}

/** 各テストで新しいファクトリを作る（モジュールスコープのキャッシュを共有しないため） */
function makeHook() {
  return createCachedSettingsHook({
    endpoint: '/api/test-settings',
    bodyKey: 'links',
    eventName: APP_EVENTS.EXTERNAL_LINKS_UPDATE,
    defaultValue: DEFAULT,
    saveErrorMessage: 'テスト設定の保存に失敗しました',
  })
}

describe('createCachedSettingsHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('APIが値を返したら反映し、isLoading が false になる', async () => {
    vi.stubGlobal('fetch', mockFetchOk(SAVED))
    const useHook = makeHook()

    const { result } = renderHook(() => useHook())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.value).toEqual(SAVED)
  })

  it('APIが data: null を返したら既定値を使う', async () => {
    vi.stubGlobal('fetch', mockFetchOk(null))
    const useHook = makeHook()

    const { result } = renderHook(() => useHook())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.value).toEqual(DEFAULT)
  })

  it('同時マウントでも fetch は1回しか走らない（キャッシュ共有）', async () => {
    const fetchMock = mockFetchOk(SAVED)
    vi.stubGlobal('fetch', fetchMock)
    const useHook = makeHook()

    const a = renderHook(() => useHook())
    const b = renderHook(() => useHook())

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    await waitFor(() => expect(b.result.current.isLoading).toBe(false))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(a.result.current.value).toEqual(SAVED)
    expect(b.result.current.value).toEqual(SAVED)
  })

  it('save するとPUTを送り、値とキャッシュを更新する', async () => {
    const fetchMock = mockFetchOk(SAVED)
    vi.stubGlobal('fetch', fetchMock)
    const useHook = makeHook()

    const { result } = renderHook(() => useHook())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.save(SAVED)
    })

    const putCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(putCall).toBeDefined()
    expect(putCall![0]).toBe('/api/test-settings')
    expect(JSON.parse(putCall![1].body)).toEqual({ links: SAVED })
    expect(result.current.value).toEqual(SAVED)
  })

  it('save が他インスタンスにも伝播する', async () => {
    // GET は DEFAULT、PUT は SAVED を返す → 伝播が起きたかを値で判別できる
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: DEFAULT }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: SAVED }) })
    )
    const useHook = makeHook()

    const a = renderHook(() => useHook())
    const b = renderHook(() => useHook())
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    await waitFor(() => expect(b.result.current.isLoading).toBe(false))
    expect(b.result.current.value).toEqual(DEFAULT)

    await act(async () => {
      await a.result.current.save(SAVED)
    })

    expect(a.result.current.value).toEqual(SAVED)
    // 保存していない側にもイベント経由で反映される
    expect(b.result.current.value).toEqual(SAVED)
  })

  it('保存失敗時はトーストを出して再スローする', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: DEFAULT }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'サーバーエラー' }) })
    )
    const useHook = makeHook()

    const { result } = renderHook(() => useHook())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(async () => { await result.current.save(SAVED) })
    ).rejects.toThrow('サーバーエラー')

    expect(toast.error).toHaveBeenCalledWith('サーバーエラー')
  })

  it('サーバーがメッセージを返さない場合は設定した日本語メッセージを出す', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: DEFAULT }) })
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })
    )
    const useHook = makeHook()

    const { result } = renderHook(() => useHook())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(async () => { await result.current.save(SAVED) })
    ).rejects.toThrow()

    expect(toast.error).toHaveBeenCalledWith('テスト設定の保存に失敗しました')
  })

  it('取得に失敗しても既定値のまま isLoading が解除される', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    const useHook = makeHook()

    const { result } = renderHook(() => useHook())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.value).toEqual(DEFAULT)
  })
})
