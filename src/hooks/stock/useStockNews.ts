import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPut } from '@/lib/apiClient'
import { playSound } from '@/lib/sound'
import { useAsyncState } from '../util/useAsyncState'
import { useAutoSave } from '../util/useAutoSave'
import type { NewsItem } from '@/types/diary'

interface UseStockNewsReturn {
  newsItems: NewsItem[]
  isLoading: boolean
  isSaving: boolean
  lastSaved: Date | null
  addNewsItem: (url: string, comment: string) => void
  removeNewsItem: (index: number) => void
  updateNewsItem: (index: number, field: 'url' | 'comment', value: string) => void
}

interface UseStockNewsOptions {
  initialData?: NewsItem[]
}

export function useStockNews(stockId: string, options?: UseStockNewsOptions): UseStockNewsReturn {
  const hasInitialData = options?.initialData !== undefined
  const [newsItems, setNewsItems] = useState<NewsItem[]>(options?.initialData ?? [])
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadNews = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{ items: NewsItem[] }>(`/api/stocks/${stockId}/news`)
    setNewsItems(data.items)
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadNews() }, [loadNews, hasInitialData])

  const { markDirty } = useAutoSave({
    value: newsItems,
    delay: 300,
    isLoading,
    onSave: async (val) => {
      await withSaving(async () => {
        const data = await apiPut<{ updatedAt: string }>(`/api/stocks/${stockId}/news`, {
          newsItems: val.map(item => ({ url: item.url, comment: item.comment })),
        })
        if (data) {
          setLastSaved(new Date(data.updatedAt))
          playSound('noteSave')
        }
      })
    },
  })

  const addNewsItem = useCallback((url: string, comment: string) => {
    setNewsItems(prev => {
      if (prev.length >= 20) return prev
      return [...prev, { url, comment }]
    })
    markDirty()
  }, [markDirty])

  const removeNewsItem = useCallback((index: number) => {
    setNewsItems(prev => prev.filter((_, i) => i !== index))
    markDirty()
  }, [markDirty])

  const updateNewsItem = useCallback((index: number, field: 'url' | 'comment', value: string) => {
    setNewsItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
    markDirty()
  }, [markDirty])

  return { newsItems, isLoading, isSaving, lastSaved, addNewsItem, removeNewsItem, updateNewsItem }
}
