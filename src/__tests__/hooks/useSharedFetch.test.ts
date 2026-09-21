import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  useSharedFetch,
  mutateShared,
  invalidateShared,
  clearSharedFetchCache,
} from '@/hooks/util/useSharedFetch'

describe('useSharedFetch', () => {
  beforeEach(() => {
    clearSharedFetchCache()
    vi.clearAllMocks()
  })

  // これが本題：カードが同時マウントしてもリクエストは1本
  it('同一キーの同時マウントでも fetcher は1回しか呼ばれない', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const a = renderHook(() => useSharedFetch('k1', fetcher))
    const b = renderHook(() => useSharedFetch('k1', fetcher))
    const c = renderHook(() => useSharedFetch('k1', fetcher))

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(a.result.current.data).toEqual(['a'])
    expect(b.result.current.data).toEqual(['a'])
    expect(c.result.current.data).toEqual(['a'])
  })

  it('キーが異なればそれぞれ取得する', async () => {
    const fetcher = vi.fn().mockImplementation((key: string) => Promise.resolve([key]))

    const a = renderHook(() => useSharedFetch('k1', fetcher))
    const b = renderHook(() => useSharedFetch('k2', fetcher))

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    await waitFor(() => expect(b.result.current.isLoading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(a.result.current.data).toEqual(['k1'])
    expect(b.result.current.data).toEqual(['k2'])
  })

  it('取得済みのキーは再マウントしても取得し直さない', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const first = renderHook(() => useSharedFetch('k1', fetcher))
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    first.unmount()

    const second = renderHook(() => useSharedFetch('k1', fetcher))

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(second.result.current.data).toEqual(['a'])
    expect(second.result.current.isLoading).toBe(false)
  })

  it('key が null の間は取得しない', () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const { result } = renderHook(() => useSharedFetch(null, fetcher))

    expect(fetcher).not.toHaveBeenCalled()
    expect(result.current.data).toBeUndefined()
    expect(result.current.isLoading).toBe(false)
  })

  it('失敗時は error を返し isLoading を解除する', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('取得失敗'))

    const { result } = renderHook(() => useSharedFetch('k1', fetcher))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('取得失敗')
    expect(result.current.data).toBeUndefined()
  })

  // 失敗を「取得済み」として永久キャッシュすると、従来のマウント毎取得より退行する
  it('失敗したキーは再マウント時に再試行する', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('一時的な失敗'))
      .mockResolvedValueOnce(['a'])

    const first = renderHook(() => useSharedFetch('k1', fetcher))
    await waitFor(() => expect(first.result.current.error).toBe('一時的な失敗'))
    expect(first.result.current.isLoading).toBe(false)
    first.unmount()

    const second = renderHook(() => useSharedFetch('k1', fetcher))
    await waitFor(() => expect(second.result.current.data).toEqual(['a']))

    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(second.result.current.error).toBeNull()
  })

  it('成功したキーは再マウントしても再試行しない', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const first = renderHook(() => useSharedFetch('k1', fetcher))
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    first.unmount()
    renderHook(() => useSharedFetch('k1', fetcher))

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('mutateShared は同一キーの全インスタンスに反映される', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const a = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    const b = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    act(() => {
      mutateShared<string[]>('k1', prev => [...(prev ?? []), 'b'])
    })

    expect(a.result.current.data).toEqual(['a', 'b'])
    expect(b.result.current.data).toEqual(['a', 'b'])
  })

  it('invalidateShared は購読中のキーを再取得する', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(['old'])
      .mockResolvedValueOnce(['new'])

    const { result } = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(result.current.data).toEqual(['old']))

    await act(async () => {
      invalidateShared(key => key === 'k1')
    })

    await waitFor(() => expect(result.current.data).toEqual(['new']))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('invalidateShared は購読者のいないキーを捨てるだけで取得はしない', async () => {
    const fetcher = vi.fn().mockResolvedValue(['old'])

    const { unmount } = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))
    unmount()

    await act(async () => {
      invalidateShared(key => key === 'k1')
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('mutateShared は未取得のキーには何もしない（fetcher無しエントリを作らない）', async () => {
    const fetcher = vi.fn().mockResolvedValue(['fetched'])

    mutateShared<string[]>('k1', () => ['injected'])

    const { result } = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // 差し込みは無視され、通常どおり取得される
    expect(result.current.data).toEqual(['fetched'])
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  // 無効化前に飛んだ古いレスポンスを「最新」として確定させないこと
  it('取得中に invalidate されたら進行中の結果を捨てて取り直す', async () => {
    let resolveFirst: (v: string[]) => void = () => {}
    const fetcher = vi.fn()
      .mockImplementationOnce(() => new Promise<string[]>(res => { resolveFirst = res }))
      .mockResolvedValueOnce(['new'])

    const { result } = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1))

    // 初回取得の最中に無効化 → 続いて古いレスポンスが到着する
    await act(async () => {
      invalidateShared(key => key === 'k1')
      resolveFirst(['stale'])
    })

    await waitFor(() => expect(result.current.data).toEqual(['new']))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  // fetcher はエントリに保持され、別インスタンス経由で呼ばれるため key だけで決まる必要がある
  it('invalidate 時の再取得には引数の key が渡る', async () => {
    const fetcher = vi.fn().mockImplementation((key: string) => Promise.resolve([key]))

    const { result } = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(result.current.data).toEqual(['k1']))

    await act(async () => {
      invalidateShared(key => key === 'k1')
    })

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2))
    expect(fetcher).toHaveBeenLastCalledWith('k1')
    expect(result.current.data).toEqual(['k1'])
  })

  // ログアウト時に前のユーザーのデータが残らないこと
  it('clearSharedFetchCache 後は取得し直す', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const first = renderHook(() => useSharedFetch('k1', fetcher))
    await waitFor(() => expect(first.result.current.isLoading).toBe(false))
    first.unmount()

    clearSharedFetchCache()

    const second = renderHook(() => useSharedFetch('k1', fetcher))
    await waitFor(() => expect(second.result.current.isLoading).toBe(false))

    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  // 単に消すだけだと、マウントしたままのコンポーネントが読み込み中で固まる
  it('clearSharedFetchCache はマウント中のインスタンスを読み込み中で放置しない', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a'])

    const { result } = renderHook(() => useSharedFetch<string[]>('k1', fetcher))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      clearSharedFetchCache()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })
})
