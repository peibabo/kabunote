import { useCallback } from 'react'
import { deleteRealizedTrade } from '@/lib/realizedTradeActions'
import { useRealizedTradesBase } from '@/hooks/util/useRealizedTradesBase'
import type { UseRealizedTradesBaseReturn } from '@/hooks/util/useRealizedTradesBase'

interface UsePortfolioRealizedTradesReturn extends UseRealizedTradesBaseReturn {
  deleteTrade: (tradeId: string, stockId?: string) => Promise<void>
}

/**
 * ポートフォリオ全体の確定損益履歴を取得するフック。
 * 確定損益は低頻度データのため全件を取得し、年フィルタや集計は呼び出し側で行う。
 * （年でサーバーフィルタすると「当年は無いが過去年にある」ケースを取りこぼすため）
 */
export function usePortfolioRealizedTrades(): UsePortfolioRealizedTradesReturn {
  const base = useRealizedTradesBase('/api/portfolio/realized')

  const deleteTrade = useCallback(async (tradeId: string, stockId?: string) => {
    await deleteRealizedTrade(tradeId, stockId)
  }, [])

  return { ...base, deleteTrade }
}
