import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { Position } from '@/types/positions'
import type { RealizedTrade } from '@/types/realizedTrade'
import type { TradeMarkerEntry } from '@/lib/stockMiniChartCalc'
import { APP_EVENTS } from '@/lib/appEvents'

interface UseTradeMarkersReturn {
  buys: TradeMarkerEntry[]
  sells: TradeMarkerEntry[]
}

export interface UseTradeMarkersOptions {
  /**
   * 一括取得済みの購入ロット・売却履歴。両方が渡された場合はマウント時のフェッチを行わない。
   * 銘柄カードを多数並べた際の N+1 API Call を避けるための入口。
   */
  initialData?: { positions: Position[]; trades: RealizedTrade[] }
}

const toBuyMarkers = (positions: Position[]): TradeMarkerEntry[] =>
  positions.map(p => ({ date: p.purchaseDate, shares: p.shares, price: p.purchasePrice }))

const toSellMarkers = (trades: RealizedTrade[]): TradeMarkerEntry[] =>
  trades.map(t => ({ date: t.sellDate, shares: t.soldShares, price: t.sellPrice }))

/**
 * 購入・売却イベントが当該銘柄宛てかを判定する。
 *
 * このフックに渡る `stockId` は DBのcuid（`stock-{symbol}` 形式ではない）のため、
 * `detail.stockId` との単純比較では一致しない。発火元ごとに detail の形が違う
 * （position-update は `symbol`、realized-update は `symbol` + `stock-{symbol}`、
 * 削除は `stock-{symbol}` のみ）ので、symbol を軸に両形式を許容する。
 */
const isForThisStock = (
  detail: { symbol?: string; stockId?: string } | undefined,
  stockId: string,
  symbol: string
): boolean => {
  if (!detail) return true // 宛先不明な発火は全体更新として扱う
  if (detail.symbol) return detail.symbol === symbol
  if (detail.stockId) return detail.stockId === stockId || detail.stockId === `stock-${symbol}`
  return false
}

/**
 * 銘柄の購入ロット・売却履歴を取得し、チャートマーカー用に整形するフック。
 * 読み取り専用。stockId が無い間はフェッチせず空を返す。
 * 購入・売却イベントを購読し、変更時に再取得する（ライブ更新）。
 *
 * `options.initialData`（`/api/stocks/list` 由来）を渡すと初回フェッチを省略する。
 *
 * @param stockId 取得先の銘柄ID（DBのcuid / `stock-{symbol}` のどちらでも可）
 * @param symbol 銘柄コード。イベントの宛先判定に使う
 */
export function useTradeMarkers(stockId: string | undefined, symbol: string, options?: UseTradeMarkersOptions): UseTradeMarkersReturn {
  const initialData = options?.initialData
  const hasInitialData = initialData !== undefined
  const [buys, setBuys] = useState<TradeMarkerEntry[]>(() => initialData ? toBuyMarkers(initialData.positions) : [])
  const [sells, setSells] = useState<TradeMarkerEntry[]>(() => initialData ? toSellMarkers(initialData.trades) : [])

  useEffect(() => {
    // stockId が無い間はフェッチしない（消費側はチャートを描画しないため初期値 [] で十分）
    if (!stockId) return

    let cancelled = false

    const load = async () => {
      try {
        const [positions, trades] = await Promise.all([
          apiFetch<Position[]>(`/api/stocks/${stockId}/position`),
          apiFetch<RealizedTrade[]>(`/api/stocks/${stockId}/position/sell`),
        ])
        if (cancelled) return
        setBuys(toBuyMarkers(positions))
        setSells(toSellMarkers(trades))
      } catch {
        // マーカーは補助情報のため、取得失敗時は静かに空にする
        if (cancelled) return
        setBuys([])
        setSells([])
      }
    }

    // initialData がある場合は一括取得済みなので初回フェッチを省略する。
    // 以降は購入・売却イベント発生時のみ取得する
    if (!hasInitialData) load()

    // 購入・売却が発生したら再取得
    const handler = (e: Event) => {
      if (isForThisStock((e as CustomEvent).detail, stockId, symbol)) load()
    }
    window.addEventListener(APP_EVENTS.DB_POSITION_UPDATE, handler)
    window.addEventListener(APP_EVENTS.DB_REALIZED_UPDATE, handler)

    return () => {
      cancelled = true
      window.removeEventListener(APP_EVENTS.DB_POSITION_UPDATE, handler)
      window.removeEventListener(APP_EVENTS.DB_REALIZED_UPDATE, handler)
    }
  }, [stockId, symbol, hasInitialData])

  return { buys, sells }
}
