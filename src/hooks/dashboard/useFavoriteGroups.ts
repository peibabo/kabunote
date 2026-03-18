import { useState, useEffect, useCallback, useRef } from 'react'
import { FavoriteGroup } from '@/types/favorites'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import { toast } from '@/lib/toast'

const FILTER_STORAGE_KEY = STORAGE_KEYS.SELECTED_GROUP_FILTER

interface UseFavoriteGroupsReturn {
  groups: FavoriteGroup[]
  setGroups: (newGroups: FavoriteGroup[]) => void
  isLoading: boolean
  selectedGroupFilter: string | null
  handleGroupFilterChange: (id: string | null) => void
}

export function useFavoriteGroups(): UseFavoriteGroupsReturn {
  const [groups, setGroupsState] = useState<FavoriteGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string | null>(null)
  // 前回のグループ状態を保持（差分計算用）
  const prevGroupsRef = useRef<FavoriteGroup[]>([])
  // DB同期中かどうか（競合防止）
  const isSyncingRef = useRef(false)

  // 初回データ読み込み
  useEffect(() => {
    const loadGroups = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/favorite-groups')
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const dbGroups: FavoriteGroup[] = result.data
            setGroupsState(dbGroups)
            prevGroupsRef.current = dbGroups

            // 保存されているフィルター状態を復元
            if (typeof window !== 'undefined') {
              const savedFilter = localStorage.getItem(FILTER_STORAGE_KEY)
              if (savedFilter && dbGroups.some(g => g.id === savedFilter)) {
                setSelectedGroupFilter(savedFilter)
              }
            }
          }
        }
      } catch (err) {
        console.error('❌ グループ取得エラー:', err)
        toast.error('グループの読み込みに少し手間取っています。再度お試しください')
      } finally {
        setIsLoading(false)
      }
    }

    loadGroups()
  }, [])

  // DB同期処理
  const syncToDb = useCallback(async (newGroups: FavoriteGroup[], prevGroups: FavoriteGroup[]) => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true

    try {
      const prevMap = new Map(prevGroups.map(g => [g.id, g]))
      const newMap = new Map(newGroups.map(g => [g.id, g]))

      // 削除されたグループ（並列実行）
      const deletedGroups = prevGroups.filter(prev => !newMap.has(prev.id))
      await Promise.all(
        deletedGroups.map(prev =>
          fetch(`/api/favorite-groups/${prev.id}`, { method: 'DELETE' })
        )
      )

      // 追加・更新されたグループ
      for (const newGroup of newGroups) {
        const prev = prevMap.get(newGroup.id)

        if (!prev) {
          // 新規グループ → POST
          const response = await fetch('/api/favorite-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: newGroup.name,
              color: newGroup.color,
              order: newGroup.order ?? newGroups.indexOf(newGroup)
            })
          })

          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              const createdGroup = result.data
              // ローカルIDをDB IDに置換
              setGroupsState(current => {
                const updated = current.map(g =>
                  g.id === newGroup.id ? { ...g, id: createdGroup.id } : g
                )
                prevGroupsRef.current = updated
                return updated
              })

              // 銘柄紐付けを追加（並列実行）
              await Promise.all(
                newGroup.stocks.map(symbol =>
                  fetch(`/api/favorite-groups/${createdGroup.id}/stocks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol })
                  })
                )
              )
            }
          }
        } else {
          // 既存グループ

          // 名前/色/orderの変更
          if (prev.name !== newGroup.name || prev.color !== newGroup.color ||
              (prev as FavoriteGroup & { order?: number }).order !== newGroup.order) {
            await fetch(`/api/favorite-groups/${newGroup.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: newGroup.name,
                color: newGroup.color,
                order: newGroup.order ?? newGroups.indexOf(newGroup)
              })
            })
          }

          // 銘柄の差分同期（並列実行）
          const prevStocks = new Set(prev.stocks)
          const newStocks = new Set(newGroup.stocks)

          const addedStocks = newGroup.stocks.filter(s => !prevStocks.has(s))
          const removedStocks = prev.stocks.filter(s => !newStocks.has(s))

          await Promise.all([
            ...addedStocks.map(symbol =>
              fetch(`/api/favorite-groups/${newGroup.id}/stocks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
              })
            ),
            ...removedStocks.map(symbol =>
              fetch(`/api/favorite-groups/${newGroup.id}/stocks`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol })
              })
            ),
          ])
        }
      }
    } catch (err) {
      console.error('❌ グループ同期エラー:', err)
      toast.error('グループの保存がうまくいきませんでした。再度お試しください')
    } finally {
      isSyncingRef.current = false
    }
  }, [])

  // setGroups: 楽観的更新 + 非同期同期
  const setGroups = useCallback((newGroups: FavoriteGroup[]) => {
    const prevGroups = prevGroupsRef.current
    // ローカル状態を即時更新
    setGroupsState(newGroups)
    prevGroupsRef.current = newGroups

    // DB同期（非同期・バックグラウンド）
    syncToDb(newGroups, prevGroups)

    // 選択中グループが削除された場合、フィルターをクリア
    setSelectedGroupFilter(prev => {
      if (prev && !newGroups.some(g => g.id === prev)) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(FILTER_STORAGE_KEY)
        }
        return null
      }
      return prev
    })
  }, [syncToDb])

  // フィルター変更（UIのみ localStorage で保持）
  const handleGroupFilterChange = useCallback((groupId: string | null) => {
    setSelectedGroupFilter(groupId)
    if (typeof window !== 'undefined') {
      if (groupId) {
        localStorage.setItem(FILTER_STORAGE_KEY, groupId)
      } else {
        localStorage.removeItem(FILTER_STORAGE_KEY)
      }
    }
  }, [])

  return {
    groups,
    setGroups,
    isLoading,
    selectedGroupFilter,
    handleGroupFilterChange
  }
}
