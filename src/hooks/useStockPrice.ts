import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'

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
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUserInput, setHasUserInput] = useState(false)

  const debouncedPrices = useDebounce(prices, 300)

  // DBから読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/price`)

      if (!response.ok) {
        throw new Error('株価の読み込みに失敗しました')
      }

      const result = await response.json()
      if (result.success) {
        setPrices({
          currentPrice: result.data.currentPrice != null ? String(result.data.currentPrice) : '',
          targetPrice: result.data.targetPrice != null ? String(result.data.targetPrice) : '',
          stopLoss: result.data.stopLossPrice != null ? String(result.data.stopLossPrice) : '',
        })
      }
    } catch (err) {
      console.error('❌ 株価読み込みエラー:', err)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // DBに保存
  const savePrices = useCallback(async (latest: PriceState) => {
    try {
      setIsSaving(true)
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

      setHasUserInput(false)
    } catch (err) {
      console.error('❌ 株価保存エラー:', err)
    } finally {
      setIsSaving(false)
    }
  }, [stockId, symbol])

  // セッター
  const setCurrentPrice = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, currentPrice: value }))
    setHasUserInput(true)
  }, [])

  const setTargetPrice = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, targetPrice: value }))
    setHasUserInput(true)
  }, [])

  const setStopLoss = useCallback((value: string) => {
    setPrices(prev => ({ ...prev, stopLoss: value }))
    setHasUserInput(true)
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadFromDatabase()
  }, [loadFromDatabase])

  // デバウンス後の自動保存
  useEffect(() => {
    if (hasUserInput && !isLoading) {
      savePrices(debouncedPrices)
    }
  }, [debouncedPrices, hasUserInput, isLoading, savePrices])

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
