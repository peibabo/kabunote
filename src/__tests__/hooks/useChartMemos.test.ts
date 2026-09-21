import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useChartMemos } from '@/hooks/portfolio/useChartMemos'
import { clearSharedFetchCache } from '@/hooks/util/useSharedFetch'
import { chartMemoKey } from '@/types/portfolio'

const mockApiFetch = vi.fn()
const mockApiPut = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
}))

const MEMO = {
  snapshotDate: '2026-01-01',
  chartType: 'stocks',
  symbol: '7203',
  content: '押し目で追加',
}

describe('useChartMemos', () => {
  beforeEach(() => {
    clearSharedFetchCache()
    mockApiFetch.mockReset()
    mockApiPut.mockReset()
    mockApiFetch.mockResolvedValue([MEMO])
    mockApiPut.mockResolvedValue({ ...MEMO, content: '更新後' })
  })

  // これが本題：全カードが完全に同一URLを叩いていた
  it('同じ期間を見る複数インスタンスでも取得は1回だけ', async () => {
    const a = renderHook(() => useChartMemos('1M'))
    const b = renderHook(() => useChartMemos('1M'))
    const c = renderHook(() => useChartMemos('1M'))

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    expect(mockApiFetch).toHaveBeenCalledWith('/api/portfolio/chart-memos?range=1M')
    expect(b.result.current.memos).toHaveLength(1)
    expect(c.result.current.memos).toHaveLength(1)
  })

  it('期間が違えばそれぞれ取得する', async () => {
    const a = renderHook(() => useChartMemos('1M'))
    const b = renderHook(() => useChartMemos('1Y'))

    await waitFor(() => expect(a.result.current.isLoading).toBe(false))
    await waitFor(() => expect(b.result.current.isLoading).toBe(false))

    expect(mockApiFetch).toHaveBeenCalledTimes(2)
  })

  it('memoMap でキー引きできる', async () => {
    const { result } = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const key = chartMemoKey('2026-01-01', 'stocks', '7203')
    expect(result.current.memoMap.get(key)?.content).toBe('押し目で追加')
  })

  it('保存すると同じ期間を見る他インスタンスにも反映される', async () => {
    const a = renderHook(() => useChartMemos('1M'))
    const b = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    await act(async () => {
      await a.result.current.saveMemo('2026-01-01', 'stocks', '7203', '更新後')
    })

    const key = chartMemoKey('2026-01-01', 'stocks', '7203')
    expect(a.result.current.memoMap.get(key)?.content).toBe('更新後')
    expect(b.result.current.memoMap.get(key)?.content).toBe('更新後')
    // 保存で再取得は走らない（初回の1回だけ）
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
  })

  it('新規メモの保存は一覧に追加される', async () => {
    mockApiFetch.mockResolvedValue([])
    const added = { snapshotDate: '2026-02-02', chartType: 'value', symbol: '', content: '新規' }
    mockApiPut.mockResolvedValue(added)

    const { result } = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.saveMemo('2026-02-02', 'value', undefined, '新規')
    })

    expect(result.current.memos).toHaveLength(1)
    expect(result.current.memoMap.get(chartMemoKey('2026-02-02', 'value'))?.content).toBe('新規')
  })

  it('削除すると同じ期間を見る他インスタンスからも消える', async () => {
    const a = renderHook(() => useChartMemos('1M'))
    const b = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(a.result.current.isLoading).toBe(false))

    mockApiFetch.mockResolvedValue(undefined)
    await act(async () => {
      await a.result.current.deleteMemo('2026-01-01', 'stocks', '7203')
    })

    expect(a.result.current.memos).toHaveLength(0)
    expect(b.result.current.memos).toHaveLength(0)
  })

  // メモは期間で絞って取得するため、他期間のキャッシュが古いままだと
  // 期間切り替えで「保存したメモが出ない／消したメモが復活する」
  it('保存すると他の期間のキャッシュは破棄され再取得される', async () => {
    const otherRange = renderHook(() => useChartMemos('1Y'))
    const current = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(otherRange.result.current.isLoading).toBe(false))
    await waitFor(() => expect(current.result.current.isLoading).toBe(false))
    expect(mockApiFetch).toHaveBeenCalledTimes(2)

    await act(async () => {
      await current.result.current.saveMemo('2026-01-01', 'stocks', '7203', '更新後')
    })

    // 1Y は購読中なので再取得が走る（1M は mutate 済みなので取得しない）
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(3))
    expect(mockApiFetch).toHaveBeenLastCalledWith('/api/portfolio/chart-memos?range=1Y')
  })

  it('削除しても他の期間のキャッシュは破棄される', async () => {
    const otherRange = renderHook(() => useChartMemos('1Y'))
    const current = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(otherRange.result.current.isLoading).toBe(false))
    await waitFor(() => expect(current.result.current.isLoading).toBe(false))
    mockApiFetch.mockClear()

    await act(async () => {
      await current.result.current.deleteMemo('2026-01-01', 'stocks', '7203')
    })

    // DELETE 1本 + 1Y の再取得
    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith('/api/portfolio/chart-memos?range=1Y')
    )
  })

  it('保存失敗時は false を返しキャッシュを変更しない', async () => {
    mockApiPut.mockRejectedValue(new Error('失敗'))

    const { result } = renderHook(() => useChartMemos('1M'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let ok: boolean | undefined
    await act(async () => {
      ok = await result.current.saveMemo('2026-01-01', 'stocks', '7203', '更新後')
    })

    expect(ok).toBe(false)
    expect(result.current.memoMap.get(chartMemoKey('2026-01-01', 'stocks', '7203'))?.content)
      .toBe('押し目で追加')
  })
})
