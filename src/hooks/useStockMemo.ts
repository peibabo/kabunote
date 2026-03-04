import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useDebounce } from './useDebounce'
import { useStringLocalStorage } from './useLocalStorage'
import { stockKey } from '@/lib/storageKeys'

interface StockMemo {
  id: string
  content: string
  updatedAt: string
}

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
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasUserInput, setHasUserInput] = useState(false)

  // localStorage フォールバック（未認証時用）
  const [localMemo, setLocalMemo] = useStringLocalStorage(stockKey.memo(stockId.replace('stock-', '')), '', 300)

  // デバウンス処理（300ms遅延で自動保存）
  const debouncedMemo = useDebounce(memo, 300)

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // 株ノオト読み込み
  const loadMemo = useCallback(async () => {
    if (!isLoggedIn) {
      // 未認証時はlocalStorageから読み込み
      setMemo(localMemo)
      setIsLoading(false)
      return
    }

    // 認証済み時はデータベースから読み込み
    await loadDataFromDatabase()
  }, [stockId, isLoggedIn, localMemo])

  // データベースからデータを取得
  const loadDataFromDatabase = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/memo`)

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラー時はlocalStorageにフォールバック
          setMemo(localMemo)
          setIsLoading(false)
          return
        }
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
      console.error('❌ 株ノオト読み込みエラー - localStorageにフォールバック:', err)
      // エラー時もlocalStorageにフォールバック（エラー表示せず）
      setMemo(localMemo)
      // エラー表示をクリアしてシームレスなフォールバック
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }, [stockId, localMemo])

  // 株ノオト保存
  const saveMemo = useCallback(async () => {
    if (!isLoggedIn) {
      // 未認証時はlocalStorageに保存
      setLocalMemo(memo)
      setHasUserInput(false) // 保存完了後にフラグをリセット
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/memo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: memo }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラー時はlocalStorageにフォールバック
          setLocalMemo(memo)
          setHasUserInput(false) // 保存完了後にフラグをリセット
          setIsSaving(false)
          return
        }
        console.error('❌ 株ノオト保存APIエラー:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        console.error('❌ エラーデータ:', errorData)
        throw new Error(errorData.message || 'メモの保存に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setLastSaved(new Date(result.data.updatedAt))
        setHasUserInput(false) // 保存完了後にフラグをリセット
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ 株ノオト保存エラー - localStorageにフォールバック:', err)
      // エラー時はlocalStorageにフォールバック（グレースフルデグラデーション）
      setLocalMemo(memo)
      setHasUserInput(false) // 保存完了後にフラグをリセット
      // エラー表示をクリアしてシームレスなフォールバック
      setError(null)
    } finally {
      setIsSaving(false)
    }
  }, [stockId, memo, isLoggedIn, setLocalMemo])

  // 株ノオト削除
  const deleteMemo = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/memo`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です')
        }
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
  }, [stockId, isLoggedIn])

  // メモ更新（楽観的更新）
  const updateMemo = useCallback((content: string) => {
    setMemo(content)
    setHasUserInput(true) // ユーザーが入力したことを記録
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