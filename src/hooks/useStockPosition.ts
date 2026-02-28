import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useDebounce } from './useDebounce'

interface StockPosition {
  id: string
  sharesOwned: number
  averagePurchasePrice: number | null
  currentPrice: number | null
  profitTarget: number | null
  lossLimit: number | null
  updatedAt: string
}

interface UseStockPositionReturn {
  position: StockPosition | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null
  updatePosition: (data: Partial<Omit<StockPosition, 'id' | 'updatedAt'>>) => void
  savePosition: () => Promise<void>
  deletePosition: () => Promise<void>
}

export function useStockPosition(stockId: string): UseStockPositionReturn {
  const [position, setPosition] = useState<StockPosition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasUserInput, setHasUserInput] = useState(false)

  // localStorage フォールバック（未認証時用）
  const getLocalStorageKey = (field: string) =>
    `kabunote-position-${stockId.replace('stock-', '')}-${field}`

  // デバウンス処理（300ms遅延で自動保存）
  const debouncedPosition = useDebounce(position, 300)

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsLoggedIn(!!session)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // ポジション読み込み
  const loadPosition = useCallback(async () => {
    if (!isLoggedIn) {
      // 未認証時はlocalStorageから読み込み
      console.log('📦 未認証 - localStorageから読み込み:', stockId)
      const localPosition = {
        id: 'local',
        sharesOwned: Number(localStorage.getItem(getLocalStorageKey('sharesOwned')) || '0'),
        averagePurchasePrice: localStorage.getItem(getLocalStorageKey('averagePurchasePrice'))
          ? Number(localStorage.getItem(getLocalStorageKey('averagePurchasePrice'))) : null,
        currentPrice: localStorage.getItem(getLocalStorageKey('currentPrice'))
          ? Number(localStorage.getItem(getLocalStorageKey('currentPrice'))) : null,
        profitTarget: localStorage.getItem(getLocalStorageKey('profitTarget'))
          ? Number(localStorage.getItem(getLocalStorageKey('profitTarget'))) : null,
        lossLimit: localStorage.getItem(getLocalStorageKey('lossLimit'))
          ? Number(localStorage.getItem(getLocalStorageKey('lossLimit'))) : null,
        updatedAt: new Date().toISOString()
      }
      setPosition(localPosition)
      setIsLoading(false)
      return
    }

    // 認証済み時はデータベースから読み込み
    console.log('🔐 認証済み - データベースから読み込み:', stockId)
    await loadDataFromDatabase()
  }, [stockId, isLoggedIn])

  // データベースからデータを取得
  const loadDataFromDatabase = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/position`)

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラー時はlocalStorageにフォールバック
          console.log('🔄 認証が必要 - localStorageにフォールバック')
          const localPosition = {
            id: 'local',
            sharesOwned: Number(localStorage.getItem(getLocalStorageKey('sharesOwned')) || '0'),
            averagePurchasePrice: localStorage.getItem(getLocalStorageKey('averagePurchasePrice'))
              ? Number(localStorage.getItem(getLocalStorageKey('averagePurchasePrice'))) : null,
            currentPrice: localStorage.getItem(getLocalStorageKey('currentPrice'))
              ? Number(localStorage.getItem(getLocalStorageKey('currentPrice'))) : null,
            profitTarget: localStorage.getItem(getLocalStorageKey('profitTarget'))
              ? Number(localStorage.getItem(getLocalStorageKey('profitTarget'))) : null,
            lossLimit: localStorage.getItem(getLocalStorageKey('lossLimit'))
              ? Number(localStorage.getItem(getLocalStorageKey('lossLimit'))) : null,
            updatedAt: new Date().toISOString()
          }
          setPosition(localPosition)
          setIsLoading(false)
          return
        }
        console.error('❌ 株式ポジション取得APIエラー:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        console.error('❌ エラーデータ:', errorData)
        throw new Error(errorData.message || 'ポジションの読み込みに失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setPosition(result.data)
        setLastSaved(new Date(result.data.updatedAt))
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ 株式ポジション読み込みエラー - localStorageにフォールバック:', err)
      // エラー時もlocalStorageにフォールバック（エラー表示せず）
      console.log('🔄 エラー発生 - localStorageにフォールバック（グレースフルデグラデーション）')
      const localPosition = {
        id: 'local',
        sharesOwned: Number(localStorage.getItem(getLocalStorageKey('sharesOwned')) || '0'),
        averagePurchasePrice: localStorage.getItem(getLocalStorageKey('averagePurchasePrice'))
          ? Number(localStorage.getItem(getLocalStorageKey('averagePurchasePrice'))) : null,
        currentPrice: localStorage.getItem(getLocalStorageKey('currentPrice'))
          ? Number(localStorage.getItem(getLocalStorageKey('currentPrice'))) : null,
        profitTarget: localStorage.getItem(getLocalStorageKey('profitTarget'))
          ? Number(localStorage.getItem(getLocalStorageKey('profitTarget'))) : null,
        lossLimit: localStorage.getItem(getLocalStorageKey('lossLimit'))
          ? Number(localStorage.getItem(getLocalStorageKey('lossLimit'))) : null,
        updatedAt: new Date().toISOString()
      }
      setPosition(localPosition)
      // エラー表示をクリアしてシームレスなフォールバック
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // ポジション保存
  const savePosition = useCallback(async () => {
    if (!position) return

    if (!isLoggedIn) {
      // 未認証時はlocalStorageに保存
      localStorage.setItem(getLocalStorageKey('sharesOwned'), position.sharesOwned.toString())
      if (position.averagePurchasePrice !== null) {
        localStorage.setItem(getLocalStorageKey('averagePurchasePrice'), position.averagePurchasePrice.toString())
      }
      if (position.currentPrice !== null) {
        localStorage.setItem(getLocalStorageKey('currentPrice'), position.currentPrice.toString())
      }
      if (position.profitTarget !== null) {
        localStorage.setItem(getLocalStorageKey('profitTarget'), position.profitTarget.toString())
      }
      if (position.lossLimit !== null) {
        localStorage.setItem(getLocalStorageKey('lossLimit'), position.lossLimit.toString())
      }
      setHasUserInput(false)
      console.log('📦 未認証 - localStorageに保存:', stockId)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sharesOwned: position.sharesOwned,
          averagePurchasePrice: position.averagePurchasePrice,
          currentPrice: position.currentPrice,
          profitTarget: position.profitTarget,
          lossLimit: position.lossLimit
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラー時はlocalStorageにフォールバック
          console.log('🔄 認証失効 - localStorageにフォールバック保存')
          localStorage.setItem(getLocalStorageKey('sharesOwned'), position.sharesOwned.toString())
          if (position.averagePurchasePrice !== null) {
            localStorage.setItem(getLocalStorageKey('averagePurchasePrice'), position.averagePurchasePrice.toString())
          }
          if (position.currentPrice !== null) {
            localStorage.setItem(getLocalStorageKey('currentPrice'), position.currentPrice.toString())
          }
          if (position.profitTarget !== null) {
            localStorage.setItem(getLocalStorageKey('profitTarget'), position.profitTarget.toString())
          }
          if (position.lossLimit !== null) {
            localStorage.setItem(getLocalStorageKey('lossLimit'), position.lossLimit.toString())
          }
          setHasUserInput(false)
          setIsSaving(false)
          return
        }
        console.error('❌ 株式ポジション保存APIエラー:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        console.error('❌ エラーデータ:', errorData)
        throw new Error(errorData.message || 'ポジションの保存に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setLastSaved(new Date(result.data.updatedAt))
        setHasUserInput(false)
        console.log('✅ 株式ポジション保存成功:', stockId)
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ 株式ポジション保存エラー - localStorageにフォールバック:', err)
      // エラー時はlocalStorageにフォールバック（グレースフルデグラデーション）
      console.log('🔄 保存エラー - localStorageにフォールバック（シームレス継続）')
      localStorage.setItem(getLocalStorageKey('sharesOwned'), position.sharesOwned.toString())
      if (position.averagePurchasePrice !== null) {
        localStorage.setItem(getLocalStorageKey('averagePurchasePrice'), position.averagePurchasePrice.toString())
      }
      if (position.currentPrice !== null) {
        localStorage.setItem(getLocalStorageKey('currentPrice'), position.currentPrice.toString())
      }
      if (position.profitTarget !== null) {
        localStorage.setItem(getLocalStorageKey('profitTarget'), position.profitTarget.toString())
      }
      if (position.lossLimit !== null) {
        localStorage.setItem(getLocalStorageKey('lossLimit'), position.lossLimit.toString())
      }
      setHasUserInput(false)
      // エラー表示をクリアしてシームレスなフォールバック
      setError(null)
    } finally {
      setIsSaving(false)
    }
  }, [stockId, position, isLoggedIn])

  // ポジション削除
  const deletePosition = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/position`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'ポジションの削除に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setPosition({
          id: 'local',
          sharesOwned: 0,
          averagePurchasePrice: null,
          currentPrice: null,
          profitTarget: null,
          lossLimit: null,
          updatedAt: new Date().toISOString()
        })
        setLastSaved(null)
        console.log('✅ 株式ポジション削除成功:', stockId)
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ 株式ポジション削除エラー:', err)
      setError(err instanceof Error ? err.message : '削除エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, isLoggedIn])

  // ポジション更新（楽観的更新）
  const updatePosition = useCallback((data: Partial<Omit<StockPosition, 'id' | 'updatedAt'>>) => {
    setPosition(prev => prev ? {
      ...prev,
      ...data,
      updatedAt: new Date().toISOString()
    } : {
      id: 'local',
      sharesOwned: data.sharesOwned || 0,
      averagePurchasePrice: data.averagePurchasePrice || null,
      currentPrice: data.currentPrice || null,
      profitTarget: data.profitTarget || null,
      lossLimit: data.lossLimit || null,
      updatedAt: new Date().toISOString()
    })
    setHasUserInput(true)
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadPosition()
  }, [loadPosition])

  // デバウンス後の自動保存（ユーザー入力があった場合のみ）
  useEffect(() => {
    if (hasUserInput && !isLoading && position) {
      savePosition()
    }
  }, [debouncedPosition, hasUserInput, isLoading, savePosition])

  return {
    position,
    isLoading,
    isSaving,
    error,
    lastSaved,
    updatePosition,
    savePosition,
    deletePosition
  }
}