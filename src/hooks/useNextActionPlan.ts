import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { NextActionPlan } from '@/types/nextActionPlan'

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

const DEFAULT_PLAN: NextActionPlan = {
  id: 'local',
  actionType: 'buy',
  priority: 'medium',
  targetPrice: null,
  targetQuantity: null,
  memo: '',
  updatedAt: new Date().toISOString()
}

export function useNextActionPlan(stockId: string): UseNextActionPlanReturn {
  const [nextActionPlan, setNextActionPlan] = useState<NextActionPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUserInput, setHasUserInput] = useState(false)

  const debouncedNextActionPlan = useDebounce(nextActionPlan, 300)

  // データベースからデータを取得
  const loadDataFromDatabase = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch(`/api/stocks/${stockId}/next-action-plan`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
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
      console.error('❌ Next Action Plan読み込みエラー:', err)
      setNextActionPlan(DEFAULT_PLAN)
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // Next Action Plan保存
  const saveNextActionPlan = useCallback(async () => {
    if (!nextActionPlan) return

    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/next-action-plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: nextActionPlan.actionType,
          priority: nextActionPlan.priority,
          targetPrice: nextActionPlan.targetPrice,
          targetQuantity: nextActionPlan.targetQuantity,
          memo: nextActionPlan.memo
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'JSONパース失敗' }))
        throw new Error(errorData.message || 'Next Action Planの保存に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setLastSaved(new Date(result.data.updatedAt))
        setHasUserInput(false)
        window.dispatchEvent(new CustomEvent('kabunote-db-strategy-update', {
          detail: {
            symbol: stockId.replace('stock-', ''),
            nextActionPlan: {
              actionType: result.data.actionType,
              priority: result.data.priority,
              targetPrice: result.data.targetPrice,
              targetShares: result.data.targetQuantity,
              strategyMemo: result.data.memo,
            }
          }
        }))
      } else {
        throw new Error('APIレスポンスが無効です')
      }
    } catch (err) {
      console.error('❌ Next Action Plan保存エラー:', err)
      setError(err instanceof Error ? err.message : '保存エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId, nextActionPlan])

  // Next Action Plan削除
  const deleteNextActionPlan = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)

      const response = await fetch(`/api/stocks/${stockId}/next-action-plan`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Next Action Planの削除に失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        setNextActionPlan(DEFAULT_PLAN)
        setLastSaved(null)
        window.dispatchEvent(new CustomEvent('kabunote-db-strategy-update', {
          detail: { symbol: stockId.replace('stock-', ''), nextActionPlan: null }
        }))
      } else {
        throw new Error('APIレスポンスが無効です')
      }
    } catch (err) {
      console.error('❌ Next Action Plan削除エラー:', err)
      setError(err instanceof Error ? err.message : '削除エラー')
    } finally {
      setIsSaving(false)
    }
  }, [stockId])

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
    loadDataFromDatabase()
  }, [loadDataFromDatabase])

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
