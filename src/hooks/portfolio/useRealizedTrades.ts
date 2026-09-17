import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { deleteRealizedTrade } from '@/lib/realizedTradeActions'
import { useAppEvent } from '../util/useAppEvent'
import { APP_EVENTS } from '@/lib/appEvents'
import type { RealizedTrade } from '@/types/realizedTrade'

interface UsePortfolioRealizedTradesReturn {
  trades: RealizedTrade[]
  isLoading: boolean
  error: string | null
  deleteTrade: (tradeId: string, stockId?: string) => Promise<void>
  refetch: () => Promise<RealizedTrade[]>
}

/**
 * ポートフォリオ全体の確定損益履歴を取得するフック。
 * 確定損益は低頻度データのため全件を取得し、年フィルタや集計は呼び出し側で行う。
 * （年でサーバーフィルタすると「当年は無いが過去年にある」ケースを取りこぼすため）
 */
export function usePortfolioRealizedTrades(): UsePortfolioRealizedTradesReturn {
  const [trades, setTrades] = useState<RealizedTrade[]>([])
  const { isLoading, error, withLoading } = useAsyncState(true)

  const loadFromDB = useCallback(async (): Promise<RealizedTrade[]> => {
    const result = await withLoading(async () => {
      const data = await apiFetch<RealizedTrade[]>('/api/portfolio/realized')
      setTrades(data)
      return data
    })
    return result ?? []
  }, [withLoading])

  useEffect(() => { loadFromDB() }, [loadFromDB])

  // 売却・削除が発生したら再取得
  useAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, () => { loadFromDB() })

  const deleteTrade = useCallback(async (tradeId: string, stockId?: string) => {
    await deleteRealizedTrade(tradeId, stockId)
  }, [])

  return { trades, isLoading, error, deleteTrade, refetch: loadFromDB }
}
