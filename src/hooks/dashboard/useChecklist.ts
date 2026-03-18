'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ChecklistItem, ChecklistResponse } from '@/types/checklist'
import { grantXp } from '@/lib/gamification'

export function useChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  const totalCount = items.length
  const checkedCount = items.filter(i => i.checked).length
  const allCompleted = totalCount > 0 && checkedCount === totalCount

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/checklist')
      if (res.ok) {
        const json = await res.json() as { data: ChecklistResponse }
        setItems(json.data.items)
      }
    } catch {
      // 取得失敗は無視
    } finally {
      setIsLoading(false)
      setHasLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const toggleCheck = useCallback(async (itemId: string, checked: boolean) => {
    // 楽観的更新
    setItems(prev => {
      const updated = prev.map(i => i.id === itemId ? { ...i, checked } : i)
      // 全完了チェック（楽観的更新後）
      const allDone = updated.length > 0 && updated.every(i => i.checked)
      if (allDone && checked) {
        // fire-and-forget XP付与
        grantXp('CHECKLIST_COMPLETE')
      }
      return updated
    })

    try {
      if (checked) {
        await fetch('/api/checklist/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistId: itemId }),
        })
      } else {
        await fetch('/api/checklist/check', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checklistId: itemId }),
        })
      }
    } catch {
      // 失敗時はリバート
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, checked: !checked } : i))
    }
  }, [])

  const addItem = useCallback(async (label: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      })
      if (res.ok) {
        const json = await res.json() as { data: ChecklistItem }
        setItems(prev => [...prev, json.data])
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const deleteItem = useCallback(async (itemId: string) => {
    // 楽観的更新
    const prev = items
    setItems(items.filter(i => i.id !== itemId))

    try {
      const res = await fetch(`/api/checklist/${itemId}`, { method: 'DELETE' })
      if (!res.ok) {
        setItems(prev)
      }
    } catch {
      setItems(prev)
    }
  }, [items])

  const updateItems = useCallback(async (updatedItems: ChecklistItem[]) => {
    // 楽観的更新
    const prev = items
    setItems(updatedItems)

    try {
      const res = await fetch('/api/checklist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: updatedItems.map(i => ({ id: i.id, label: i.label, order: i.order })),
        }),
      })
      if (!res.ok) {
        setItems(prev)
      }
    } catch {
      setItems(prev)
    }
  }, [items])

  const applyPreset = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/checklist/preset', { method: 'POST' })
      if (res.ok) {
        const json = await res.json() as { data: ChecklistResponse }
        setItems(json.data.items)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  return {
    items,
    isLoading,
    hasLoaded,
    totalCount,
    checkedCount,
    allCompleted,
    toggleCheck,
    addItem,
    deleteItem,
    updateItems,
    applyPreset,
  }
}
