'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '@/hooks/util/useAsyncState'
import { useAppEvent } from '@/hooks/util/useAppEvent'
import { APP_EVENTS } from '@/lib/appEvents'
import type { RealizedTrade } from '@/types/realizedTrade'

export interface UseRealizedTradesBaseReturn {
  trades: RealizedTrade[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<RealizedTrade[]>
}

/**
 * 確定損益履歴の取得と再取得を担う共通ロジック。
 *
 * 銘柄単位（`useRealizedTrades`）とポートフォリオ全体
 * （`usePortfolioRealizedTrades`）で、取得先と「イベントを自分宛てとみなす条件」
 * 以外は完全に同じなのでここに集約する。削除操作は呼び出し側で公開する。
 *
 * @param endpoint 取得先のAPIエンドポイント
 * @param stockId 指定時は、その銘柄向けのイベントのみで再取得する
 */
export function useRealizedTradesBase(
  endpoint: string,
  stockId?: string
): UseRealizedTradesBaseReturn {
  const [trades, setTrades] = useState<RealizedTrade[]>([])
  const { isLoading, error, withLoading } = useAsyncState(true)

  const loadFromDB = useCallback(async (): Promise<RealizedTrade[]> => {
    const result = await withLoading(async () => {
      const data = await apiFetch<RealizedTrade[]>(endpoint)
      setTrades(data)
      return data
    })
    return result ?? []
  }, [endpoint, withLoading])

  useEffect(() => { loadFromDB() }, [loadFromDB])

  // 売却・削除が発生したら再取得。
  // stockId 指定時は detail が無い（宛先不明＝全体更新）か自分宛てのときだけ反応する
  useAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, (detail) => {
    if (!stockId || !detail || detail.stockId === stockId) loadFromDB()
  })

  return { trades, isLoading, error, refetch: loadFromDB }
}
