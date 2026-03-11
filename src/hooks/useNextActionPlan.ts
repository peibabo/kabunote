import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiPut, apiDelete } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { useAutoSave } from './useAutoSave'
import { NextActionPlan } from '@/types/nextActionPlan'
import { playSound } from '@/lib/sound'

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

interface UseNextActionPlanOptions {
  initialData?: NextActionPlan | null
}

export function useNextActionPlan(stockId: string, options?: UseNextActionPlanOptions): UseNextActionPlanReturn {
  const hasInitialData = options?.initialData !== undefined
  const [nextActionPlan, setNextActionPlan] = useState<NextActionPlan | null>(options?.initialData ?? null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { isLoading, isSaving, error, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadData = useCallback(() => withLoading(async () => {
    try {
      const data = await apiFetch<NextActionPlan>(`/api/stocks/${stockId}/next-action-plan`)
      setNextActionPlan(data)
      setLastSaved(new Date(data.updatedAt))
    } catch {
      setNextActionPlan(DEFAULT_PLAN)
    }
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadData() }, [loadData, hasInitialData])

  const { markDirty } = useAutoSave({
    value: nextActionPlan,
    delay: 300,
    isLoading,
    onSave: async (plan) => {
      if (!plan) return
      await withSaving(async () => {
        const data = await apiPut<NextActionPlan>(`/api/stocks/${stockId}/next-action-plan`, {
          actionType: plan.actionType,
          priority: plan.priority,
          targetPrice: plan.targetPrice,
          targetQuantity: plan.targetQuantity,
          memo: plan.memo
        })
        if (data) {
          setLastSaved(new Date(data.updatedAt))
          playSound('noteSave')
          window.dispatchEvent(new CustomEvent('kabunote-db-strategy-update', {
            detail: {
              symbol: stockId.replace('stock-', ''),
              nextActionPlan: {
                actionType: data.actionType,
                priority: data.priority,
                targetPrice: data.targetPrice,
                targetShares: data.targetQuantity,
                strategyMemo: data.memo,
              }
            }
          }))
        }
      })
    },
  })

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
    markDirty()
  }, [markDirty])

  const deleteNextActionPlan = useCallback(() => withSaving(async () => {
    await apiDelete(`/api/stocks/${stockId}/next-action-plan`)
    setNextActionPlan(DEFAULT_PLAN)
    setLastSaved(null)
    window.dispatchEvent(new CustomEvent('kabunote-db-strategy-update', {
      detail: { symbol: stockId.replace('stock-', ''), nextActionPlan: null }
    }))
  }) as Promise<void>, [stockId, withSaving])

  return {
    nextActionPlan,
    isLoading,
    isSaving,
    error,
    lastSaved,
    updateNextActionPlan,
    saveNextActionPlan: () => Promise.resolve(),
    deleteNextActionPlan
  }
}
