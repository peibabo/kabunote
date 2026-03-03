import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { CustomTag, TagColor } from '@/types/tags'

interface UseStockTagReturn {
  tags: CustomTag[]
  isLoading: boolean
  addTag: (label: string, color: TagColor) => Promise<void>
  removeTag: (tagId: string) => Promise<void>
  setTags: (tags: CustomTag[]) => void
}

export function useStockTag(stockId: string): UseStockTagReturn {
  // stockId: "stock-7203" 形式 → symbol: "7203"
  const symbol = stockId.replace('stock-', '')
  const localStorageKey = `kabunote-tags-${symbol}`

  const [tags, setTagsState] = useState<CustomTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // localStorage からの読み込み
  const loadFromLocalStorage = useCallback((): CustomTag[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(localStorageKey)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }, [localStorageKey])

  // DB からの読み込み（localStorageデータをDB移行含む）
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/tag`)

      if (!response.ok) {
        if (response.status === 401) {
          setTagsState(loadFromLocalStorage())
          return
        }
        throw new Error('タグの読み込みに失敗しました')
      }

      const result = await response.json()
      if (!result.success) throw new Error('タグ取得レスポンスエラー')

      const dbTags: CustomTag[] = result.data

      // localStorage に残存データがあればDB移行する
      const localTags = loadFromLocalStorage()
      if (localTags.length > 0) {
        const dbLabels = new Set(dbTags.map(t => t.label))
        const toMigrate = localTags.filter(t => !dbLabels.has(t.label))

        if (toMigrate.length > 0) {
          await Promise.all(
            toMigrate.map(t =>
              fetch(`/api/stocks/${stockId}/tag`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: t.label, color: t.color }),
              }).catch(() => null)
            )
          )
          // 移行後にlocalStorageを削除
          localStorage.removeItem(localStorageKey)
          // 最新データを再取得
          const refreshed = await fetch(`/api/stocks/${stockId}/tag`)
          if (refreshed.ok) {
            const refreshedResult = await refreshed.json()
            if (refreshedResult.success) {
              setTagsState(refreshedResult.data)
              return
            }
          }
        }
      }

      setTagsState(dbTags)
    } catch {
      setTagsState(loadFromLocalStorage())
    } finally {
      setIsLoading(false)
    }
  }, [stockId, localStorageKey, loadFromLocalStorage])

  // 初回読み込み
  useEffect(() => {
    if (!isLoggedIn) {
      setTagsState(loadFromLocalStorage())
      setIsLoading(false)
      return
    }
    loadFromDatabase()
  }, [isLoggedIn, loadFromDatabase, loadFromLocalStorage])

  // タグ追加
  const addTag = useCallback(async (label: string, color: TagColor) => {
    const tempId = `temp-${Date.now()}`
    const newTag: CustomTag = {
      id: tempId,
      label,
      color,
      createdAt: new Date().toISOString(),
    }

    // 楽観的更新
    setTagsState(prev => [...prev, newTag])

    if (!isLoggedIn) {
      // localStorageに保存
      if (typeof window !== 'undefined') {
        const current = loadFromLocalStorage()
        const updated = [...current, newTag]
        localStorage.setItem(localStorageKey, JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('localStorageChange', { detail: { key: localStorageKey } }))
      }
      return
    }

    try {
      const response = await fetch(`/api/stocks/${stockId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, color }),
      })

      if (!response.ok) throw new Error('タグの追加に失敗しました')

      const result = await response.json()
      if (result.success) {
        // 仮IDをDBのIDに差し替え
        setTagsState(prev => prev.map(t => t.id === tempId ? result.data : t))
        window.dispatchEvent(new CustomEvent('kabunote-db-tag-update'))
      }
    } catch {
      // 失敗時はロールバック
      setTagsState(prev => prev.filter(t => t.id !== tempId))
    }
  }, [isLoggedIn, stockId, localStorageKey, loadFromLocalStorage])

  // タグ削除
  const removeTag = useCallback(async (tagId: string) => {
    // 楽観的更新
    setTagsState(prev => prev.filter(t => t.id !== tagId))

    if (!isLoggedIn) {
      // localStorageから削除
      if (typeof window !== 'undefined') {
        const current = loadFromLocalStorage()
        const updated = current.filter(t => t.id !== tagId)
        localStorage.setItem(localStorageKey, JSON.stringify(updated))
        window.dispatchEvent(new CustomEvent('localStorageChange', { detail: { key: localStorageKey } }))
      }
      return
    }

    try {
      const response = await fetch(`/api/stocks/${stockId}/tag/${tagId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('タグの削除に失敗しました')
      window.dispatchEvent(new CustomEvent('kabunote-db-tag-update'))
    } catch {
      // 失敗時は再読み込みで復元
      await loadFromDatabase()
    }
  }, [isLoggedIn, stockId, localStorageKey, loadFromLocalStorage, loadFromDatabase])

  const setTags = useCallback((newTags: CustomTag[]) => {
    setTagsState(newTags)
  }, [])

  return { tags, isLoading, addTag, removeTag, setTags }
}
