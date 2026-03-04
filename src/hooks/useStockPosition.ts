import { useState, useEffect, useCallback } from 'react'
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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const symbol = stockId.replace('stock-', '')

  // DBからポジション一覧を取得
  const loadFromDB = useCallback(async (): Promise<Position[]> => {
    setIsLoading(true)
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/position`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        const data = result.data as Position[]
        setPositions(data)
        return data
      }
      throw new Error('APIレスポンスが無効です')
    } catch (err) {
      console.error('❌ ポジション読み込みエラー:', err)
      setError(err instanceof Error ? err.message : '読み込みエラー')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // 初回読み込み
  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  const refetch = loadFromDB

  // ポジション追加
  const addPosition = useCallback(async (data: Omit<Position, 'id' | 'createdAt'>) => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/stocks/${stockId}/position`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('保存に失敗しました')
      }

      const result = await response.json()
      if (result.success) {
        const newPositions = await loadFromDB()
        window.dispatchEvent(new CustomEvent('kabunote-db-position-update', {
          detail: { symbol, positions: newPositions }
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '追加エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, symbol, loadFromDB])

  // ポジション更新
  const updatePosition = useCallback(async (id: string, data: Partial<Omit<Position, 'id' | 'createdAt'>>) => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/stocks/${stockId}/position/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('更新に失敗しました')
      }

      const result = await response.json()
      if (result.success) {
        const updatedPositions = await loadFromDB()
        window.dispatchEvent(new CustomEvent('kabunote-db-position-update', {
          detail: { symbol, positions: updatedPositions }
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, symbol, loadFromDB])

  // ポジション削除
  const deletePosition = useCallback(async (id: string) => {
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/stocks/${stockId}/position/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('削除に失敗しました')
      }

      const remainingPositions = await loadFromDB()
      window.dispatchEvent(new CustomEvent('kabunote-db-position-update', {
        detail: { symbol, positions: remainingPositions }
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, symbol, loadFromDB])

  return {
    positions,
    isLoading,
    isSaving,
    error,
    addPosition,
    updatePosition,
    deletePosition,
    refetch
  }
}
