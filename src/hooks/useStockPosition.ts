import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPost } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { Position } from '@/types/positions'

interface UseStockPositionReturn {
  positions: Position[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  addPosition: (data: Omit<Position, 'id' | 'createdAt'>) => Promise<void>
  updatePosition: (id: string, data: Partial<Omit<Position, 'id' | 'createdAt'>>) => Promise<void>
  deletePosition: (id: string) => Promise<void>
  refetch: () => Promise<Position[]>
}

export function useStockPosition(stockId: string): UseStockPositionReturn {
  const [positions, setPositions] = useState<Position[]>([])
  const symbol = stockId.replace('stock-', '')
  const { isLoading, isSaving, error, withLoading, withSaving } = useAsyncState()

  const loadFromDB = useCallback(async (): Promise<Position[]> => {
    const result = await withLoading(async () => {
      const data = await apiFetch<Position[]>(`/api/stocks/${stockId}/position`)
      setPositions(data)
      return data
    })
    return result ?? []
  }, [stockId, withLoading])

  useEffect(() => { loadFromDB() }, [loadFromDB])

  const dispatchUpdate = useCallback((newPositions: Position[]) => {
    window.dispatchEvent(new CustomEvent('kabunote-db-position-update', {
      detail: { symbol, positions: newPositions }
    }))
  }, [symbol])

  const addPosition = useCallback(async (data: Omit<Position, 'id' | 'createdAt'>) => {
    await withSaving(async () => {
      await apiPost(`/api/stocks/${stockId}/position`, data)
      const newPositions = await loadFromDB()
      dispatchUpdate(newPositions)
    })
  }, [stockId, withSaving, loadFromDB, dispatchUpdate])

  const updatePosition = useCallback(async (id: string, data: Partial<Omit<Position, 'id' | 'createdAt'>>) => {
    await withSaving(async () => {
      const response = await fetch(`/api/stocks/${stockId}/position/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('更新に失敗しました')
      const result = await response.json()
      if (!result.success) throw new Error('APIレスポンスが無効です')
      const updatedPositions = await loadFromDB()
      dispatchUpdate(updatedPositions)
    })
  }, [stockId, withSaving, loadFromDB, dispatchUpdate])

  const deletePosition = useCallback(async (id: string) => {
    await withSaving(async () => {
      const response = await fetch(`/api/stocks/${stockId}/position/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('削除に失敗しました')
      const remainingPositions = await loadFromDB()
      dispatchUpdate(remainingPositions)
    })
  }, [stockId, withSaving, loadFromDB, dispatchUpdate])

  return { positions, isLoading, isSaving, error, addPosition, updatePosition, deletePosition, refetch: loadFromDB }
}
