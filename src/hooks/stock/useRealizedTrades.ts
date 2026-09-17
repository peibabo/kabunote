import { useCallback } from 'react'
import { deleteRealizedTrade } from '@/lib/realizedTradeActions'
import { useRealizedTradesBase } from '@/hooks/util/useRealizedTradesBase'
import type { UseRealizedTradesBaseReturn } from '@/hooks/util/useRealizedTradesBase'

interface UseRealizedTradesReturn extends UseRealizedTradesBaseReturn {
  deleteTrade: (tradeId: string) => Promise<void>
}

/** 当該銘柄の確定損益履歴を取得するフック */
export function useRealizedTrades(stockId: string): UseRealizedTradesReturn {
  const base = useRealizedTradesBase(`/api/stocks/${stockId}/position/sell`, stockId)

  const deleteTrade = useCallback(async (tradeId: string) => {
    await deleteRealizedTrade(tradeId, stockId)
  }, [stockId])

  return { ...base, deleteTrade }
}
