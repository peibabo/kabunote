import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { useAutoSave } from './useAutoSave'

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

export function useStockPrice(stockId: string): UseStockPriceReturn {
  const symbol = stockId.replace('stock-', '')
  const [prices, setPrices] = useState<PriceState>({ currentPrice: '', targetPrice: '', stopLoss: '' })
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState()

  const loadPrices = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{ currentPrice: number | null; targetPrice: number | null; stopLossPrice: number | null }>(`/api/stocks/${stockId}/price`)
    setPrices({
      currentPrice: data.currentPrice != null ? String(data.currentPrice) : '',
      targetPrice: data.targetPrice != null ? String(data.targetPrice) : '',
      stopLoss: data.stopLossPrice != null ? String(data.stopLossPrice) : '',
    })
  }), [stockId, withLoading])

  useEffect(() => { loadPrices() }, [loadPrices])

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
