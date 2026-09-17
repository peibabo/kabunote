import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { deleteRealizedTrade } from '@/lib/realizedTradeActions'
import { useAppEvent } from '../util/useAppEvent'
import { APP_EVENTS } from '@/lib/appEvents'
import type { RealizedTrade } from '@/types/realizedTrade'

interface UseRealizedTradesReturn {
  trades: RealizedTrade[]
  isLoading: boolean
  error: string | null
  deleteTrade: (tradeId: string) => Promise<void>
  refetch: () => Promise<RealizedTrade[]>
}

/** 当該銘柄の確定損益履歴を取得するフック */
export function useRealizedTrades(stockId: string): UseRealizedTradesReturn {
  const [trades, setTrades] = useState<RealizedTrade[]>([])
  const { isLoading, error, withLoading } = useAsyncState(true)

  const loadFromDB = useCallback(async (): Promise<RealizedTrade[]> => {
    const result = await withLoading(async () => {
      const data = await apiFetch<RealizedTrade[]>(`/api/stocks/${stockId}/position/sell`)
      setTrades(data)
      return data
    })
    return result ?? []
  }, [stockId, withLoading])

  useEffect(() => { loadFromDB() }, [loadFromDB])

  // 売却・削除が発生したら履歴を再取得
  useAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, (detail) => {
    if (!detail || detail.stockId === stockId) loadFromDB()
  })

  const deleteTrade = useCallback(async (tradeId: string) => {
    await deleteRealizedTrade(tradeId, stockId)
  }, [stockId])

  return { trades, isLoading, error, deleteTrade, refetch: loadFromDB }
}
