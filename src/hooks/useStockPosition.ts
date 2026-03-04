import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { Position, calculatePositionSummary } from '@/types/positions'

interface UseStockPositionReturn {
  positions: Position[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  addPosition: (data: Omit<Position, 'id' | 'createdAt'>) => Promise<void>
  updatePosition: (id: string, data: Partial<Omit<Position, 'id' | 'createdAt'>>) => Promise<void>
  deletePosition: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

const LOCALSTORAGE_PREFIX = 'kabunote-positions-'

export function useStockPosition(stockId: string): UseStockPositionReturn {
  const [positions, setPositions] = useState<Position[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // シンボルを stockId から抽出（例: "stock-7203" → "7203"）
  const symbol = stockId.replace('stock-', '')
  const localKey = `${LOCALSTORAGE_PREFIX}${symbol}`

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setIsLoggedIn(!!session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // localStorageにポジションをキャッシュ（他コンポーネントとの互換性維持）
  const cacheToLocalStorage = useCallback((data: Position[]) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(localKey, JSON.stringify(data))
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key: localKey }
        }))
      } catch {
        // ignore storage errors
      }
    }
  }, [localKey])

  // DBからポジション一覧を取得
  const loadFromDB = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/position`)

      if (!response.ok) {
        if (response.status === 401) {
          return null // 認証失効 → fallback
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        return result.data as Position[]
      }
      throw new Error('APIレスポンスが無効です')
    } catch {
      return null // エラー → fallback
    }
  }, [stockId])

  // localStorageからポジション一覧を取得
  const loadFromLocalStorage = useCallback((): Position[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(localKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }, [localKey])

  // ポジション読み込み
  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      if (isLoggedIn) {
        const dbData = await loadFromDB()
        if (dbData !== null) {
          setPositions(dbData)
          cacheToLocalStorage(dbData)
          return
        }
        // DBエラー時はlocalStorageにフォールバック
      }
      const localData = loadFromLocalStorage()
      setPositions(localData)
    } finally {
      setIsLoading(false)
    }
  }, [isLoggedIn, loadFromDB, loadFromLocalStorage, cacheToLocalStorage])

  // 初回・認証状態変化時に読み込み
  useEffect(() => {
    load()
  }, [load])

  const refetch = load

  // ポジション追加
  const addPosition = useCallback(async (data: Omit<Position, 'id' | 'createdAt'>) => {
    setIsSaving(true)
    setError(null)
    try {
      if (isLoggedIn) {
        const response = await fetch(`/api/stocks/${stockId}/position`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            await load()
            window.dispatchEvent(new CustomEvent('kabunote-db-position-update'))
            return
          }
        }
        if (response.status !== 401) {
          throw new Error('保存に失敗しました')
        }
        // 401 → localStorageにフォールバック
      }

      // localStorage保存
      const newPosition: Position = {
        ...data,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString()
      }
      const updated = [...positions, newPosition]
      setPositions(updated)
      cacheToLocalStorage(updated)

    } catch (err) {
      setError(err instanceof Error ? err.message : '追加エラー')
    } finally {
      setIsSaving(false)
    }
  }, [isLoggedIn, stockId, positions, load, cacheToLocalStorage])

  // ポジション更新
  const updatePosition = useCallback(async (id: string, data: Partial<Omit<Position, 'id' | 'createdAt'>>) => {
    setIsSaving(true)
    setError(null)
    try {
      if (isLoggedIn && !id.startsWith('local-')) {
        const response = await fetch(`/api/stocks/${stockId}/position/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            await load()
            window.dispatchEvent(new CustomEvent('kabunote-db-position-update'))
            return
          }
        }
        if (response.status !== 401) {
          throw new Error('更新に失敗しました')
        }
      }

      // localStorageフォールバック
      const updated = positions.map(p =>
        p.id === id ? { ...p, ...data } : p
      )
      setPositions(updated)
      cacheToLocalStorage(updated)

    } catch (err) {
      setError(err instanceof Error ? err.message : '更新エラー')
    } finally {
      setIsSaving(false)
    }
  }, [isLoggedIn, stockId, positions, load, cacheToLocalStorage])

  // ポジション削除
  const deletePosition = useCallback(async (id: string) => {
    setIsSaving(true)
    setError(null)
    try {
      if (isLoggedIn && !id.startsWith('local-')) {
        const response = await fetch(`/api/stocks/${stockId}/position/${id}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          await load()
          window.dispatchEvent(new CustomEvent('kabunote-db-position-update'))
          return
        }
        if (response.status !== 401) {
          throw new Error('削除に失敗しました')
        }
      }

      // localStorageフォールバック
      const updated = positions.filter(p => p.id !== id)
      setPositions(updated)
      cacheToLocalStorage(updated)

    } catch (err) {
      setError(err instanceof Error ? err.message : '削除エラー')
    } finally {
      setIsSaving(false)
    }
  }, [isLoggedIn, stockId, positions, load, cacheToLocalStorage])

  return {
    positions,
    isLoading,
    isSaving,
    error,
    addPosition,
    updatePosition,
    deletePosition,
    refetch
  }
}
