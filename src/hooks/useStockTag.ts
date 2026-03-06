import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPost, apiDelete } from '@/lib/apiClient'
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

  const loadFromDatabase = useCallback(async () => {
    try {
      const data = await apiFetch<CustomTag[]>(`/api/stocks/${stockId}/tag`)
      setTagsState(data)
    } catch (err) {
      console.error('❌ タグ読み込みエラー:', err)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  useEffect(() => { loadFromDatabase() }, [loadFromDatabase])

  const addTag = useCallback(async (label: string, color: TagColor) => {
    const tempId = `temp-${Date.now()}`
    const newTag: CustomTag = { id: tempId, label, color, createdAt: new Date().toISOString() }
    setTagsState(prev => [...prev, newTag])

    try {
      const data = await apiPost<CustomTag>(`/api/stocks/${stockId}/tag`, { label, color })
      setTagsState(prev => {
        const updatedTags = [...prev.filter(t => t.id !== tempId), data]
        window.dispatchEvent(new CustomEvent('kabunote-db-tag-update', {
          detail: { symbol, tags: updatedTags }
        }))
        return updatedTags
      })
    } catch (err) {
      console.error('❌ タグ追加エラー:', err)
      setTagsState(prev => prev.filter(t => t.id !== tempId))
    }
  }, [stockId, symbol])

  const removeTag = useCallback(async (tagId: string) => {
    setTagsState(prev => prev.filter(t => t.id !== tagId))

    try {
      await apiDelete(`/api/stocks/${stockId}/tag/${tagId}`)
      setTagsState(prev => {
        window.dispatchEvent(new CustomEvent('kabunote-db-tag-update', {
          detail: { symbol, tags: prev }
        }))
        return prev
      })
    } catch (err) {
      console.error('❌ タグ削除エラー:', err)
      await loadFromDatabase()
    }
  }, [stockId, symbol, loadFromDatabase])

  const setTags = useCallback((newTags: CustomTag[]) => {
    setTagsState(newTags)
  }, [])

  return { tags, isLoading, addTag, removeTag, setTags }
}
