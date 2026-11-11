import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useStockMemo } from '@/hooks/stock/useStockMemo'

const mockApiFetch = vi.fn()
const mockApiPut = vi.fn()
const mockApiDelete = vi.fn()

vi.mock('@/lib/apiClient', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: (...args: unknown[]) => mockApiDelete(...args),
}))

vi.mock('@/lib/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))

vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
}))

describe('useStockMemo', () => {
  beforeEach(() => {
    mockApiFetch.mockReset()
    mockApiPut.mockReset()
    mockApiDelete.mockReset()
    mockApiFetch.mockResolvedValue({ content: 'APIメモ', updatedAt: '2024-06-01T00:00:00Z' })
    mockApiPut.mockResolvedValue({ updatedAt: '2024-06-01T00:00:00Z' })
    mockApiDelete.mockResolvedValue({})
  })

  it('API読込: 初期データがない場合APIからロード', async () => {
    const { result } = renderHook(() => useStockMemo('stock-7203'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.memo).toBe('APIメモ')
    expect(mockApiFetch).toHaveBeenCalledWith('/api/stocks/stock-7203/memo')
  })

  it('initialDataがある場合APIを呼ばない', () => {
    mockApiFetch.mockReset()
    const { result } = renderHook(() =>
      useStockMemo('stock-7203', { initialData: '初期メモ' })
    )
    expect(result.current.memo).toBe('初期メモ')
    expect(result.current.isLoading).toBe(false)
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('updateMemo: メモを更新', () => {
    const { result } = renderHook(() =>
      useStockMemo('stock-7203', { initialData: '' })
    )

    act(() => { result.current.updateMemo('新しいメモ') })
    expect(result.current.memo).toBe('新しいメモ')
  })

  it('deleteMemo: メモを削除', async () => {
    const { result } = renderHook(() =>
      useStockMemo('stock-7203', { initialData: 'メモ内容' })
    )

    await act(async () => {
      await result.current.deleteMemo()
    })

    expect(mockApiDelete).toHaveBeenCalledWith('/api/stocks/stock-7203/memo')
    expect(result.current.memo).toBe('')
  })

  it('保存成功時に DB_MEMO_UPDATE を発火する（ダッシュボードのガイド進捗に反映）', async () => {
    const listener = vi.fn()
    window.addEventListener('kabunote-db-memo-update', listener)
    const { result } = renderHook(() =>
      useStockMemo('stock-7203', { initialData: '' })
    )

    act(() => { result.current.updateMemo('気になった理由') })

    await waitFor(() => { expect(listener).toHaveBeenCalled() })
    const event = listener.mock.calls[0][0] as CustomEvent
    expect(event.detail).toEqual({ symbol: '7203', memo: '気になった理由' })
    window.removeEventListener('kabunote-db-memo-update', listener)
  })

  it('deleteMemo時に空メモで DB_MEMO_UPDATE を発火する', async () => {
    const listener = vi.fn()
    window.addEventListener('kabunote-db-memo-update', listener)
    const { result } = renderHook(() =>
      useStockMemo('stock-7203', { initialData: 'メモ内容' })
    )

    await act(async () => { await result.current.deleteMemo() })

    const event = listener.mock.calls.at(-1)?.[0] as CustomEvent
    expect(event.detail).toEqual({ symbol: '7203', memo: '' })
    window.removeEventListener('kabunote-db-memo-update', listener)
  })

  it('APIエラー時にerrorが設定される', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useStockMemo('stock-7203'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.error).toBe('Network error')
  })
})
