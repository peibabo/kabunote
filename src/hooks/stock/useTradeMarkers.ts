import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/apiClient'
import type { Position } from '@/types/positions'
import type { RealizedTrade } from '@/types/realizedTrade'
import type { TradeMarkerEntry } from '@/lib/stockMiniChartCalc'

interface UseTradeMarkersReturn {
  buys: TradeMarkerEntry[]
  sells: TradeMarkerEntry[]
}

/**
 * 銘柄の購入ロット・売却履歴を取得し、チャートマーカー用に整形するフック。
 * 読み取り専用。stockId が無い間はフェッチせず空を返す。
 * 購入・売却イベントを購読し、変更時に再取得する（ライブ更新）。
 */
export function useTradeMarkers(stockId: string | undefined): UseTradeMarkersReturn {
  const [buys, setBuys] = useState<TradeMarkerEntry[]>([])
  const [sells, setSells] = useState<TradeMarkerEntry[]>([])

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
        setBuys(positions.map(p => ({
          date: p.purchaseDate,
          shares: p.shares,
          price: p.purchasePrice,
        })))
        setSells(trades.map(t => ({
          date: t.sellDate,
          shares: t.soldShares,
          price: t.sellPrice,
        })))
      } catch {
        // マーカーは補助情報のため、取得失敗時は静かに空にする
        if (cancelled) return
        setBuys([])
        setSells([])
      }
    }

    load()

    // 購入・売却が発生したら再取得
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      // position-update は symbol、realized-update は stockId を持つ
      if (!detail || detail.stockId === stockId || detail.symbol === stockId.replace('stock-', '')) {
        load()
      }
    }
    window.addEventListener('kabunote-db-position-update', handler)
    window.addEventListener('kabunote-db-realized-update', handler)

    return () => {
      cancelled = true
      window.removeEventListener('kabunote-db-position-update', handler)
      window.removeEventListener('kabunote-db-realized-update', handler)
    }
  }, [stockId])

  return { buys, sells }
}
