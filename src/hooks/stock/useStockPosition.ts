import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPost } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { Position } from '@/types/positions'
import { grantXp } from '@/lib/gamification'
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'
import type { RealizedTrade, SellPositionInput } from '@/types/realizedTrade'

interface UseStockPositionReturn {
  positions: Position[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
  addPosition: (data: Omit<Position, 'id' | 'createdAt'>) => Promise<void>
  updatePosition: (id: string, data: Partial<Omit<Position, 'id' | 'createdAt'>>) => Promise<void>
  deletePosition: (id: string) => Promise<void>
  sellPosition: (data: SellPositionInput) => Promise<RealizedTrade | null>
  refetch: () => Promise<Position[]>
}

interface UseStockPositionOptions {
  initialData?: Position[]
}

export function useStockPosition(stockId: string, options?: UseStockPositionOptions): UseStockPositionReturn {
  const hasInitialData = options?.initialData !== undefined
  const [positions, setPositions] = useState<Position[]>(options?.initialData ?? [])
  const symbol = stockId.replace('stock-', '')
  const { isLoading, isSaving, error, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadFromDB = useCallback(async (): Promise<Position[]> => {
    const result = await withLoading(async () => {
      const data = await apiFetch<Position[]>(`/api/stocks/${stockId}/position`)
      setPositions(data)
      return data
    })
    return result ?? []
  }, [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadFromDB() }, [loadFromDB, hasInitialData])

  const dispatchUpdate = useCallback((newPositions: Position[]) => {
    emitAppEvent(APP_EVENTS.DB_POSITION_UPDATE, { symbol, positions: newPositions })
  }, [symbol])

  const addPosition = useCallback(async (data: Omit<Position, 'id' | 'createdAt'>) => {
    await withSaving(async () => {
      await apiPost(`/api/stocks/${stockId}/position`, data)
      const newPositions = await loadFromDB()
      dispatchUpdate(newPositions)
      grantXp('POSITION_ADD')
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

  const sellPosition = useCallback(async (data: SellPositionInput): Promise<RealizedTrade | null> => {
    const result = await withSaving(async () => {
      const { trade, positions: updated } = await apiPost<{ trade: RealizedTrade; positions: Position[] }>(
        `/api/stocks/${stockId}/position/sell`,
        data
      )
      setPositions(updated)
      dispatchUpdate(updated)
      // 確定損益履歴ビューの再取得をトリガー
      emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { symbol, stockId })
      grantXp('POSITION_SELL')
      return trade
    })
    return result ?? null
  }, [stockId, symbol, withSaving, dispatchUpdate])

  return { positions, isLoading, isSaving, error, addPosition, updatePosition, deletePosition, sellPosition, refetch: loadFromDB }
}
