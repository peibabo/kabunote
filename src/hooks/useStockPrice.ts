import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
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
  const localCurrentPriceKey = `kabunote-current-price-${symbol}`
  const localTargetPriceKey = `kabunote-target-price-${symbol}`
  const localStopLossKey = `kabunote-stop-loss-${symbol}`

  const [prices, setPrices] = useState<PriceState>({ currentPrice: '', targetPrice: '', stopLoss: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasUserInput, setHasUserInput] = useState(false)

  const debouncedPrices = useDebounce(prices, 300)

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session)
    })
    return () => subscription.unsubscribe()
  }, [])

  // localStorageから読み込み
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return
    setPrices({
      currentPrice: localStorage.getItem(localCurrentPriceKey) || '',
      targetPrice: localStorage.getItem(localTargetPriceKey) || '',
      stopLoss: localStorage.getItem(localStopLossKey) || '',
    })
    setIsLoading(false)
  }, [localCurrentPriceKey, localTargetPriceKey, localStopLossKey])

  // DBから読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/price`)

      if (!response.ok) {
        if (response.status === 401) {
          loadFromLocalStorage()
          return
        }
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
      console.error('❌ 株価読み込みエラー - localStorageにフォールバック:', err)
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }, [stockId, loadFromLocalStorage])

  // データ読み込み
  const loadData = useCallback(async () => {
    if (!isLoggedIn) {
      loadFromLocalStorage()
      return
    }
    await loadFromDatabase()
  }, [isLoggedIn, loadFromLocalStorage, loadFromDatabase])

  // DBに保存
  const savePrices = useCallback(async (latest: PriceState) => {
    if (!isLoggedIn) {
      localStorage.setItem(localCurrentPriceKey, latest.currentPrice)
      localStorage.setItem(localTargetPriceKey, latest.targetPrice)
      localStorage.setItem(localStopLossKey, latest.stopLoss)
      setHasUserInput(false)
      return
    }

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

      if (!response.ok && response.status !== 401) {
        throw new Error('株価の保存に失敗しました')
      }

      if (response.status === 401) {
        localStorage.setItem(localCurrentPriceKey, latest.currentPrice)
        localStorage.setItem(localTargetPriceKey, latest.targetPrice)
        localStorage.setItem(localStopLossKey, latest.stopLoss)
      } else {
        window.dispatchEvent(new CustomEvent('kabunote-db-price-update'))
      }

      setHasUserInput(false)
    } catch (err) {
      console.error('❌ 株価保存エラー - localStorageにフォールバック:', err)
      localStorage.setItem(localCurrentPriceKey, latest.currentPrice)
      localStorage.setItem(localTargetPriceKey, latest.targetPrice)
      localStorage.setItem(localStopLossKey, latest.stopLoss)
      setHasUserInput(false)
    } finally {
      setIsSaving(false)
    }
  }, [stockId, isLoggedIn, localCurrentPriceKey, localTargetPriceKey, localStopLossKey])

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
    loadData()
  }, [loadData])

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
