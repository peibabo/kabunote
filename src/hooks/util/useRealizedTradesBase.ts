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

export interface UseRealizedTradesBaseOptions {
  /**
   * 一括取得済みの確定損益。渡された場合はマウント時のフェッチを行わない。
   * 銘柄カードを多数並べた際の N+1 API Call を避けるための入口。
   */
  initialData?: RealizedTrade[]
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
 * @param options initialData を渡すと初回フェッチを省略する
 */
export function useRealizedTradesBase(
  endpoint: string,
  stockId?: string,
  options?: UseRealizedTradesBaseOptions
): UseRealizedTradesBaseReturn {
  const hasInitialData = options?.initialData !== undefined
  const [trades, setTrades] = useState<RealizedTrade[]>(options?.initialData ?? [])
  const { isLoading, error, withLoading } = useAsyncState(!hasInitialData)

  const loadFromDB = useCallback(async (): Promise<RealizedTrade[]> => {
    const result = await withLoading(async () => {
      const data = await apiFetch<RealizedTrade[]>(endpoint)
      setTrades(data)
      return data
    })
    return result ?? []
  }, [endpoint, withLoading])

  // initialData がある場合は一括取得済みなので初回フェッチを省略する。
  // 以降の更新は DB_REALIZED_UPDATE イベントで必要になったときだけ取得する
  useEffect(() => { if (!hasInitialData) loadFromDB() }, [loadFromDB, hasInitialData])

  // 売却・削除が発生したら再取得。
  // stockId 指定時は detail が無い（宛先不明＝全体更新）か自分宛てのときだけ反応する
  useAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, (detail) => {
    if (!stockId || !detail || detail.stockId === stockId) loadFromDB()
  })

  return { trades, isLoading, error, refetch: loadFromDB }
}
