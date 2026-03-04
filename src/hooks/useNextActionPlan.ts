import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useDebounce } from './useDebounce'
import { NextActionPlan } from '@/types/nextActionPlan'
import { stockKey } from '@/lib/storageKeys'

interface UseNextActionPlanReturn {
  nextActionPlan: NextActionPlan | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastSaved: Date | null
  updateNextActionPlan: (data: Partial<Omit<NextActionPlan, 'id' | 'updatedAt'>>) => void
  saveNextActionPlan: () => Promise<void>
  deleteNextActionPlan: () => Promise<void>
}

export function useNextActionPlan(stockId: string): UseNextActionPlanReturn {
  const [nextActionPlan, setNextActionPlan] = useState<NextActionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasUserInput, setHasUserInput] = useState(false)

  // localStorage フォールバック（未認証時用）
  const getLocalStorageKey = (field: string) =>
    stockKey.nextActionPlanField(stockId.replace('stock-', ''), field)

  // デバウンス処理（300ms遅延で自動保存）
  const debouncedNextActionPlan = useDebounce(nextActionPlan, 300)

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

  // Next Action Plan読み込み
  const loadNextActionPlan = useCallback(async () => {
    if (!isLoggedIn) {
      // 未認証時はlocalStorageから読み込み
      const localPlan = {
        id: 'local',
        actionType: (localStorage.getItem(getLocalStorageKey('actionType')) as 'buy' | 'sell' | 'hold') || 'buy',
        priority: (localStorage.getItem(getLocalStorageKey('priority')) as 'high' | 'medium' | 'low') || 'medium',
        targetPrice: localStorage.getItem(getLocalStorageKey('targetPrice'))
          ? Number(localStorage.getItem(getLocalStorageKey('targetPrice'))) : null,
        targetQuantity: localStorage.getItem(getLocalStorageKey('targetQuantity'))
          ? Number(localStorage.getItem(getLocalStorageKey('targetQuantity'))) : null,
        memo: localStorage.getItem(getLocalStorageKey('memo')) || '',
        updatedAt: new Date().toISOString()
      }
      setNextActionPlan(localPlan)
      setIsLoading(false)
      return
    }

    // 認証済み時はデータベースから読み込み
    await loadDataFromDatabase()
  }, [stockId, isLoggedIn])

  // データベースからデータを取得
  const loadDataFromDatabase = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/next-action-plan`)

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラー時はlocalStorageにフォールバック
          const localPlan = {
            id: 'local',
            actionType: (localStorage.getItem(getLocalStorageKey('actionType')) as 'buy' | 'sell' | 'hold') || 'buy',
            priority: (localStorage.getItem(getLocalStorageKey('priority')) as 'high' | 'medium' | 'low') || 'medium',
            targetPrice: localStorage.getItem(getLocalStorageKey('targetPrice'))
              ? Number(localStorage.getItem(getLocalStorageKey('targetPrice'))) : null,
            targetQuantity: localStorage.getItem(getLocalStorageKey('targetQuantity'))
              ? Number(localStorage.getItem(getLocalStorageKey('targetQuantity'))) : null,
            memo: localStorage.getItem(getLocalStorageKey('memo')) || '',
            updatedAt: new Date().toISOString()
          }
          setNextActionPlan(localPlan)
          setIsLoading(false)
          return
        }
        console.error('❌ Next Action Plan取得APIエラー:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        console.error('❌ エラーデータ:', errorData)
        throw new Error(errorData.message || 'Next Action Planの読み込みに失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setNextActionPlan(result.data)
        setLastSaved(new Date(result.data.updatedAt))
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ Next Action Plan読み込みエラー - localStorageにフォールバック:', err)
      // エラー時もlocalStorageにフォールバック（エラー表示せず）
      const localPlan = {
        id: 'local',
        actionType: (localStorage.getItem(getLocalStorageKey('actionType')) as 'buy' | 'sell' | 'hold') || 'buy',
        priority: (localStorage.getItem(getLocalStorageKey('priority')) as 'high' | 'medium' | 'low') || 'medium',
        targetPrice: localStorage.getItem(getLocalStorageKey('targetPrice'))
          ? Number(localStorage.getItem(getLocalStorageKey('targetPrice'))) : null,
        targetQuantity: localStorage.getItem(getLocalStorageKey('targetQuantity'))
          ? Number(localStorage.getItem(getLocalStorageKey('targetQuantity'))) : null,
        memo: localStorage.getItem(getLocalStorageKey('memo')) || '',
        updatedAt: new Date().toISOString()
      }
      setNextActionPlan(localPlan)
      // エラー表示をクリアしてシームレスなフォールバック
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // Next Action Plan保存
  const saveNextActionPlan = useCallback(async () => {
    if (!nextActionPlan) return

    if (!isLoggedIn) {
      // 未認証時はlocalStorageに保存
      localStorage.setItem(getLocalStorageKey('actionType'), nextActionPlan.actionType)
      localStorage.setItem(getLocalStorageKey('priority'), nextActionPlan.priority)
      if (nextActionPlan.targetPrice !== null) {
        localStorage.setItem(getLocalStorageKey('targetPrice'), nextActionPlan.targetPrice.toString())
      }
      if (nextActionPlan.targetQuantity !== null) {
        localStorage.setItem(getLocalStorageKey('targetQuantity'), nextActionPlan.targetQuantity.toString())
      }
      localStorage.setItem(getLocalStorageKey('memo'), nextActionPlan.memo)
      setHasUserInput(false)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/next-action-plan`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          actionType: nextActionPlan.actionType,
          priority: nextActionPlan.priority,
          targetPrice: nextActionPlan.targetPrice,
          targetQuantity: nextActionPlan.targetQuantity,
          memo: nextActionPlan.memo
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 認証エラー時はlocalStorageにフォールバック
          localStorage.setItem(getLocalStorageKey('actionType'), nextActionPlan.actionType)
          localStorage.setItem(getLocalStorageKey('priority'), nextActionPlan.priority)
          if (nextActionPlan.targetPrice !== null) {
            localStorage.setItem(getLocalStorageKey('targetPrice'), nextActionPlan.targetPrice.toString())
          }
          if (nextActionPlan.targetQuantity !== null) {
            localStorage.setItem(getLocalStorageKey('targetQuantity'), nextActionPlan.targetQuantity.toString())
          }
          localStorage.setItem(getLocalStorageKey('memo'), nextActionPlan.memo)
          setHasUserInput(false)
          setIsSaving(false)
          return
        }
        console.error('❌ Next Action Plan保存APIエラー:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        console.error('❌ エラーデータ:', errorData)
        throw new Error(errorData.message || 'Next Action Planの保存に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setLastSaved(new Date(result.data.updatedAt))
        setHasUserInput(false)
        window.dispatchEvent(new CustomEvent('kabunote-db-strategy-update'))
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ Next Action Plan保存エラー - localStorageにフォールバック:', err)
      // エラー時はlocalStorageにフォールバック（グレースフルデグラデーション）
      localStorage.setItem(getLocalStorageKey('actionType'), nextActionPlan.actionType)
      localStorage.setItem(getLocalStorageKey('priority'), nextActionPlan.priority)
      if (nextActionPlan.targetPrice !== null) {
        localStorage.setItem(getLocalStorageKey('targetPrice'), nextActionPlan.targetPrice.toString())
      }
      if (nextActionPlan.targetQuantity !== null) {
        localStorage.setItem(getLocalStorageKey('targetQuantity'), nextActionPlan.targetQuantity.toString())
      }
      localStorage.setItem(getLocalStorageKey('memo'), nextActionPlan.memo)
      setHasUserInput(false)
      // エラー表示をクリアしてシームレスなフォールバック
      setError(null)
    } finally {
      setIsSaving(false)
    }
  }, [stockId, nextActionPlan, isLoggedIn])

  // Next Action Plan削除
  const deleteNextActionPlan = useCallback(async () => {
    if (!isLoggedIn) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/next-action-plan`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('認証が必要です')
        }
        const errorData = await response.json()
        throw new Error(errorData.message || 'Next Action Planの削除に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setNextActionPlan({
          id: 'local',
          actionType: 'buy',
          priority: 'medium',
          targetPrice: null,
          targetQuantity: null,
          memo: '',
          updatedAt: new Date().toISOString()
        })
        setLastSaved(null)
      } else {
        throw new Error('APIレスポンスが無効です')
      }

    } catch (err) {
      console.error('❌ Next Action Plan削除エラー:', err)
      setError(err instanceof Error ? err.message : '削除エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, isLoggedIn])

  // Next Action Plan更新（楽観的更新）
  const updateNextActionPlan = useCallback((data: Partial<Omit<NextActionPlan, 'id' | 'updatedAt'>>) => {
    setNextActionPlan(prev => prev ? {
      ...prev,
      ...data,
      updatedAt: new Date().toISOString()
    } : {
      id: 'local',
      actionType: data.actionType || 'buy',
      priority: data.priority || 'medium',
      targetPrice: data.targetPrice || null,
      targetQuantity: data.targetQuantity || null,
      memo: data.memo || '',
      updatedAt: new Date().toISOString()
    })
    setHasUserInput(true)
  }, [])

  // 初回読み込み
  useEffect(() => {
    loadNextActionPlan()
  }, [loadNextActionPlan])

  // デバウンス後の自動保存（ユーザー入力があった場合のみ）
  useEffect(() => {
    if (hasUserInput && !isLoading && nextActionPlan) {
      saveNextActionPlan()
    }
  }, [debouncedNextActionPlan, hasUserInput, isLoading, saveNextActionPlan])

  return {
    nextActionPlan,
    isLoading,
    isSaving,
    error,
    lastSaved,
    updateNextActionPlan,
    saveNextActionPlan,
    deleteNextActionPlan
  }
}

