import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from './util/useAsyncState'
import { useAutoSave } from './util/useAutoSave'

interface PriceState {
  currentPrice: string
  targetPrice: string
  stopLoss: string
}

interface UseStockPriceReturn {
  currentPrice: string
  targetPrice: string
  stopLoss: string
  isLoading: boolean
  isSaving: boolean
  setCurrentPrice: (value: string) => void
  setTargetPrice: (value: string) => void
  setStopLoss: (value: string) => void
}

interface UseStockPriceOptions {
  initialData?: { currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }
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
      }
    }
    return { currentPrice: '', targetPrice: '', stopLoss: '' }
  })
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadPrices = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{ currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }>(`/api/stocks/${stockId}/price`)
    setPrices({
      currentPrice: data.currentPrice != null ? String(data.currentPrice) : '',
      targetPrice: data.targetPrice != null ? String(data.targetPrice) : '',
      stopLoss: data.stopLossPrice != null ? String(data.stopLossPrice) : '',
    })
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadPrices() }, [loadPrices, hasInitialData])

  const { markDirty } = useAutoSave({
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

  return {
    currentPrice: prices.currentPrice,
    targetPrice: prices.targetPrice,
    stopLoss: prices.stopLoss,
    isLoading,
    isSaving,
    setCurrentPrice,
    setTargetPrice,
    setStopLoss,
  }
}
