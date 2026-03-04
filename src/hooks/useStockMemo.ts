import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'

interface UseStockMemoReturn {
  memo: string
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null
  updateMemo: (content: string) => void
  saveMemo: () => Promise<void>
  deleteMemo: () => Promise<void>
}

export function useStockMemo(stockId: string): UseStockMemoReturn {
  const [memo, setMemo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUserInput, setHasUserInput] = useState(false)

  const debouncedMemo = useDebounce(memo, 300)

  // 株ノオト読み込み
  const loadMemo = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/memo`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'メモの読み込みに失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setMemo(result.data.content)
        setLastSaved(new Date(result.data.updatedAt))
      } else {
        throw new Error('APIレスポンスが無効です')
      }
    } catch (err) {
      console.error('❌ 株ノオト読み込みエラー:', err)
      setError(err instanceof Error ? err.message : '読み込みエラー')
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // 株ノオト保存
  const saveMemo = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/memo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: memo }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        throw new Error(errorData.message || 'メモの保存に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setLastSaved(new Date(result.data.updatedAt))
        setHasUserInput(false)
      } else {
        throw new Error('APIレスポンスが無効です')
      }
    } catch (err) {
      console.error('❌ 株ノオト保存エラー:', err)
      setError(err instanceof Error ? err.message : '保存エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, memo])

  // 株ノオト削除
  const deleteMemo = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/memo`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'メモの削除に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setMemo('')
        setLastSaved(null)
      } else {
        throw new Error('APIレスポンスが無効です')
      }
    } catch (err) {
      console.error('❌ 株ノオト削除エラー:', err)
      setError(err instanceof Error ? err.message : '削除エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId])

  // メモ更新（楽観的更新）
  const updateMemo = useCallback((content: string) => {
    setMemo(content)
    setHasUserInput(true)
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadMemo()
  }, [loadMemo])

  // デバウンス後の自動保存（ユーザー入力があった場合のみ）
  useEffect(() => {
    if (hasUserInput && !isLoading) {
      saveMemo()
    }
  }, [debouncedMemo, hasUserInput, isLoading, saveMemo])

  return {
    memo,
    isLoading,
    isSaving,
    error,
    lastSaved,
    updateMemo,
    saveMemo,
    deleteMemo
  }
}
