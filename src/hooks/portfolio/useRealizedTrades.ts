import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { summarizeRealizedTrades } from '@/lib/realizedTradeCalc'
import type { RealizedTrade, RealizedTradeSummary } from '@/types/realizedTrade'

interface UsePortfolioRealizedTradesReturn {
  trades: RealizedTrade[]
  summary: RealizedTradeSummary
  isLoading: boolean
  error: string | null
  refetch: () => Promise<RealizedTrade[]>
}

/** ポートフォリオ全体の確定損益履歴を取得するフック（year指定で年フィルタ） */
export function usePortfolioRealizedTrades(year?: number): UsePortfolioRealizedTradesReturn {
  const [trades, setTrades] = useState<RealizedTrade[]>([])
  const { isLoading, error, withLoading } = useAsyncState(true)

  const loadFromDB = useCallback(async (): Promise<RealizedTrade[]> => {
    const result = await withLoading(async () => {
      const query = year ? `?year=${year}` : ''
      const data = await apiFetch<RealizedTrade[]>(`/api/portfolio/realized${query}`)
      setTrades(data)
      return data
    })
    return result ?? []
  }, [year, withLoading])

  useEffect(() => { loadFromDB() }, [loadFromDB])

  // 売却が発生したら再取得
  useEffect(() => {
    const handler = () => loadFromDB()
    window.addEventListener('kabunote-db-realized-update', handler)
    return () => window.removeEventListener('kabunote-db-realized-update', handler)
  }, [loadFromDB])

  return { trades, summary: summarizeRealizedTrades(trades), isLoading, error, refetch: loadFromDB }
}
