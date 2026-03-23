import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { useAutoSave } from '../util/useAutoSave'
import { grantXp } from '@/lib/gamification'

interface PriceState {
  currentPrice: string
  targetPrice: string
  stopLoss: string
  per: string
  pbr: string
  fairPer: string
  fairPbr: string
}

interface UseStockPriceReturn {
  currentPrice: string
  targetPrice: string
  stopLoss: string
  per: string
  pbr: string
  fairPer: string
  fairPbr: string
  isLoading: boolean
  isSaving: boolean
  setCurrentPrice: (value: string) => void
  setTargetPrice: (value: string) => void
  setStopLoss: (value: string) => void
  setPer: (value: string) => void
  setPbr: (value: string) => void
  setFairPer: (value: string) => void
  setFairPbr: (value: string) => void
  flushSave: () => void
}

interface UseStockPriceOptions {
  initialData?: {
    currentPrice: number | null
    targetPrice: number | null
    stopLossPrice: number | null
    per: number | null
    pbr: number | null
    fairPer: number | null
    fairPbr: number | null
  }
}

export function useStockPrice(stockId: string, options?: UseStockPriceOptions): UseStockPriceReturn {
  const hasInitialData = options?.initialData !== undefined
  const symbol = stockId.replace('stock-', '')
  const [prices, setPrices] = useState<PriceState>(() => {
    if (options?.initialData) {
      const d = options.initialData
      return {
        currentPrice: d.currentPrice != null ? String(d.currentPrice) : '',
        targetPrice: d.targetPrice != null ? String(d.targetPrice) : '',
        stopLoss: d.stopLossPrice != null ? String(d.stopLossPrice) : '',
        per: d.per != null ? String(d.per) : '',
        pbr: d.pbr != null ? String(d.pbr) : '',
        fairPer: d.fairPer != null ? String(d.fairPer) : '',
        fairPbr: d.fairPbr != null ? String(d.fairPbr) : '',
      }
    }
    return { currentPrice: '', targetPrice: '', stopLoss: '', per: '', pbr: '', fairPer: '', fairPbr: '' }
  })
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadPrices = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{ currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null; per: number | null; pbr: number | null; fairPer: number | null; fairPbr: number | null }>(`/api/stocks/${stockId}/price`)
    setPrices({
      currentPrice: data.currentPrice != null ? String(data.currentPrice) : '',
      targetPrice: data.targetPrice != null ? String(data.targetPrice) : '',
      stopLoss: data.stopLossPrice != null ? String(data.stopLossPrice) : '',
      per: data.per != null ? String(data.per) : '',
      pbr: data.pbr != null ? String(data.pbr) : '',
      fairPer: data.fairPer != null ? String(data.fairPer) : '',
      fairPbr: data.fairPbr != null ? String(data.fairPbr) : '',
    })
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadPrices() }, [loadPrices, hasInitialData])

  const { markDirty, flush } = useAutoSave({
    value: prices,
    delay: 300,
    isLoading,
    onSave: async (latest) => {
      await withSaving(async () => {
        const response = await fetch(`/api/stocks/${stockId}/price`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPrice: latest.currentPrice ? parseFloat(latest.currentPrice) : null,
            targetPrice: latest.targetPrice ? parseFloat(latest.targetPrice) : null,
            stopLossPrice: latest.stopLoss ? parseFloat(latest.stopLoss) : null,
            per: latest.per ? parseFloat(latest.per) : null,
            pbr: latest.pbr ? parseFloat(latest.pbr) : null,
            fairPer: latest.fairPer ? parseFloat(latest.fairPer) : null,
            fairPbr: latest.fairPbr ? parseFloat(latest.fairPbr) : null,
          })
        })
        if (response.ok) {
          window.dispatchEvent(new CustomEvent('kabunote-db-price-update', {
            detail: {
              symbol,
              currentPrice: latest.currentPrice ? parseFloat(latest.currentPrice) : null,
              targetPrice: latest.targetPrice ? parseFloat(latest.targetPrice) : null,
              stopLossPrice: latest.stopLoss ? parseFloat(latest.stopLoss) : null,
            }
          }))
          grantXp('PRICE_UPDATE')
        }
      })
    },
  })

  const setCurrentPrice = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, currentPrice: value }))
    markDirty()
  }, [markDirty])

  const setTargetPrice = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, targetPrice: value }))
    markDirty()
  }, [markDirty])

  const setStopLoss = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, stopLoss: value }))
    markDirty()
  }, [markDirty])

  const setPer = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, per: value }))
    markDirty()
  }, [markDirty])

  const setPbr = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, pbr: value }))
    markDirty()
  }, [markDirty])

  const setFairPer = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, fairPer: value }))
    markDirty()
  }, [markDirty])

  const setFairPbr = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, fairPbr: value }))
    markDirty()
  }, [markDirty])

  return {
    currentPrice: prices.currentPrice,
    targetPrice: prices.targetPrice,
    stopLoss: prices.stopLoss,
    per: prices.per,
    pbr: prices.pbr,
    fairPer: prices.fairPer,
    fairPbr: prices.fairPbr,
    isLoading,
    isSaving,
    setCurrentPrice,
    setTargetPrice,
    setStopLoss,
    setPer,
    setPbr,
    setFairPer,
    setFairPbr,
    flushSave: flush,
  }
}
