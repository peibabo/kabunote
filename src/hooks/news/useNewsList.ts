import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { NewsListResponse } from '@/types/diary'

const PAGE_SIZE = 50

export type NewsSource = 'all' | 'diary' | 'stock'

interface UseNewsListReturn {
  items: NewsListResponse['items']
  total: number
  isLoading: boolean
  hasMore: boolean
  loadMore: () => void
  source: NewsSource
  setSource: (source: NewsSource) => void
}

export function useNewsList(isOpen: boolean): UseNewsListReturn {
  const [items, setItems] = useState<NewsListResponse['items']>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [source, setSourceState] = useState<NewsSource>('all')

  const fetchNews = useCallback(async (currentOffset: number, append: boolean, currentSource: NewsSource) => {
    setIsLoading(true)
    try {
      const data = await apiFetch<NewsListResponse>(
        `/api/diary/news?limit=${PAGE_SIZE}&offset=${currentOffset}&source=${currentSource}`
      )
      setItems(prev => append ? [...prev, ...data.items] : data.items)
      setTotal(data.total)
    } catch {
      // エラー時は無視
    } finally {
      setIsLoading(false)
    }
  }, [])

  // モーダルが開かれたら初回読み込み
  useEffect(() => {
    if (isOpen) {
      setOffset(0)
      fetchNews(0, false, source)
    } else {
      setItems([])
      setTotal(0)
      setOffset(0)
    }
  }, [isOpen, fetchNews, source])

  const loadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchNews(newOffset, true, source)
  }, [offset, fetchNews, source])

  const setSource = useCallback((newSource: NewsSource) => {
    setSourceState(newSource)
    setOffset(0)
    // リロードは useEffect が source 変更を検知して行う
  }, [])

  return {
    items,
    total,
    isLoading,
    hasMore: items.length < total,
    loadMore,
    source,
    setSource,
  }
}
