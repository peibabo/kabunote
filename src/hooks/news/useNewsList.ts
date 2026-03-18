import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { NewsListItem, NewsListResponse } from '@/types/diary'

const PAGE_SIZE = 50

interface UseNewsListReturn {
  items: NewsListItem[]
  total: number
  isLoading: boolean
  hasMore: boolean
  loadMore: () => void
}

export function useNewsList(isOpen: boolean): UseNewsListReturn {
  const [items, setItems] = useState<NewsListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(0)

  const fetchNews = useCallback(async (currentOffset: number, append: boolean) => {
    setIsLoading(true)
    try {
      const data = await apiFetch<NewsListResponse>(
        `/api/diary/news?limit=${PAGE_SIZE}&offset=${currentOffset}`
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
      fetchNews(0, false)
    } else {
      setItems([])
      setTotal(0)
      setOffset(0)
    }
  }, [isOpen, fetchNews])

  const loadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchNews(newOffset, true)
  }, [offset, fetchNews])

  return {
    items,
    total,
    isLoading,
    hasMore: items.length < total,
    loadMore,
  }
}
