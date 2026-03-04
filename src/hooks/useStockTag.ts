import { useState, useEffect, useCallback } from 'react'
import { CustomTag, TagColor } from '@/types/tags'

interface UseStockTagReturn {
  tags: CustomTag[]
  isLoading: boolean
  addTag: (label: string, color: TagColor) => Promise<void>
  removeTag: (tagId: string) => Promise<void>
  setTags: (tags: CustomTag[]) => void
}

export function useStockTag(stockId: string): UseStockTagReturn {
  const symbol = stockId.replace('stock-', '')

  const [tags, setTagsState] = useState<CustomTag[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // DB からの読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/tag`)

      if (!response.ok) {
        throw new Error('タグの読み込みに失敗しました')
      }

      const result = await response.json()
      if (!result.success) throw new Error('タグ取得レスポンスエラー')

      setTagsState(result.data)
    } catch (err) {
      console.error('❌ タグ読み込みエラー:', err)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // 初回読み込み
  useEffect(() => {
    loadFromDatabase()
  }, [loadFromDatabase])

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

    try {
      const response = await fetch(`/api/stocks/${stockId}/tag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, color }),
      })

      if (!response.ok) throw new Error('タグの追加に失敗しました')

      const result = await response.json()
      if (result.success) {
        setTagsState(prev => {
          const updatedTags = [...prev.filter(t => t.id !== tempId), result.data]
          window.dispatchEvent(new CustomEvent('kabunote-db-tag-update', {
            detail: { symbol, tags: updatedTags }
          }))
          return updatedTags
        })
      }
    } catch (err) {
      console.error('❌ タグ追加エラー:', err)
      // 失敗時はロールバック
      setTagsState(prev => prev.filter(t => t.id !== tempId))
    }
  }, [stockId, symbol])

  // タグ削除
  const removeTag = useCallback(async (tagId: string) => {
    // 楽観的更新
    setTagsState(prev => prev.filter(t => t.id !== tagId))

    try {
      const response = await fetch(`/api/stocks/${stockId}/tag/${tagId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('タグの削除に失敗しました')

      setTagsState(prev => {
        window.dispatchEvent(new CustomEvent('kabunote-db-tag-update', {
          detail: { symbol, tags: prev }
        }))
        return prev
      })
    } catch (err) {
      console.error('❌ タグ削除エラー:', err)
      // 失敗時は再読み込みで復元
      await loadFromDatabase()
    }
  }, [stockId, symbol, loadFromDatabase])

  const setTags = useCallback((newTags: CustomTag[]) => {
    setTagsState(newTags)
  }, [])

  return { tags, isLoading, addTag, removeTag, setTags }
}
