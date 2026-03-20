import { useState, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { ChartMemoFilter, ChartMemoListItem, ChartMemoListResponse } from '@/types/portfolio'

const PAGE_SIZE = 50

interface UseChartMemoListReturn {
  items: ChartMemoListItem[]
  total: number
  isLoading: boolean
  hasMore: boolean
  loadMore: () => void
  filter: ChartMemoFilter
  setFilter: (filter: ChartMemoFilter) => void
  deleteItem: (item: ChartMemoListItem) => Promise<boolean>
}

export function useChartMemoList(isOpen: boolean): UseChartMemoListReturn {
  const [items, setItems] = useState<ChartMemoListItem[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [filter, setFilterState] = useState<ChartMemoFilter>('all')

  const fetchMemos = useCallback(async (currentOffset: number, append: boolean, currentFilter: ChartMemoFilter) => {
    setIsLoading(true)
    try {
      const data = await apiFetch<ChartMemoListResponse>(
        `/api/portfolio/chart-memos/list?limit=${PAGE_SIZE}&offset=${currentOffset}&chartType=${currentFilter}`
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
      fetchMemos(0, false, filter)
    } else {
      setItems([])
      setTotal(0)
      setOffset(0)
    }
  }, [isOpen, fetchMemos, filter])

  const loadMore = useCallback(() => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchMemos(newOffset, true, filter)
  }, [offset, fetchMemos, filter])

  const setFilter = useCallback((newFilter: ChartMemoFilter) => {
    setFilterState(newFilter)
    setOffset(0)
  }, [])

  const deleteItem = useCallback(async (item: ChartMemoListItem): Promise<boolean> => {
    try {
      const params = new URLSearchParams({
        snapshotDate: item.snapshotDate,
        chartType: item.chartType,
        symbol: item.symbol,
      })
      const res = await fetch(`/api/portfolio/chart-memos?${params}`, { method: 'DELETE' })
      if (!res.ok) return false
      setItems(prev => prev.filter(m => m.id !== item.id))
      setTotal(prev => prev - 1)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    items,
    total,
    isLoading,
    hasMore: items.length < total,
    loadMore,
    filter,
    setFilter,
    deleteItem,
  }
}
