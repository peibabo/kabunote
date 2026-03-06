import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { useAutoSave } from './useAutoSave'
import { ShareholderRightsSettings, createDefaultShareholderRightsSettings } from '@/types/rightsDate'

interface BenefitState {
  description: string
  minimumShares: string
  estimatedValue: string
  rightsSettings: ShareholderRightsSettings
}

interface UseStockBenefitReturn {
  description: string
  minimumShares: string
  estimatedValue: string
  rightsSettings: ShareholderRightsSettings
  isLoading: boolean
  isSaving: boolean
  updateDescription: (value: string) => void
  updateMinimumShares: (value: string) => void
  updateEstimatedValue: (value: string) => void
  updateRightsSettings: (settings: ShareholderRightsSettings) => void
}

export function useStockBenefit(stockId: string): UseStockBenefitReturn {
  const [state, setState] = useState<BenefitState>({
    description: '',
    minimumShares: '',
    estimatedValue: '',
    rightsSettings: createDefaultShareholderRightsSettings(),
  })
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState()

  const loadData = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{
      description: string | null; minimumShares: number | null; estimatedValue: number | null
      rightsMonth: number | null; rightsDay: number | null
    }>(`/api/stocks/${stockId}/benefit`)
    if (data) {
      setState({
        description: data.description ?? '',
        minimumShares: data.minimumShares != null ? String(data.minimumShares) : '',
        estimatedValue: data.estimatedValue != null ? String(data.estimatedValue) : '',
        rightsSettings: data.rightsMonth != null && data.rightsDay != null
          ? { month: data.rightsMonth, day: data.rightsDay, isRecurring: true, isActive: true }
          : createDefaultShareholderRightsSettings(),
      })
    }
  }), [stockId, withLoading])

  useEffect(() => { loadData() }, [loadData])

  const { markDirty } = useAutoSave({
    value: state,
    delay: 500,
    isLoading,
    onSave: async (val) => {
      await withSaving(async () => {
        const response = await fetch(`/api/stocks/${stockId}/benefit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: val.description || null,
            minimumShares: val.minimumShares ? parseInt(val.minimumShares) : null,
            estimatedValue: val.estimatedValue ? parseFloat(val.estimatedValue) : null,
            rightsMonth: val.rightsSettings.month,
            rightsDay: val.rightsSettings.day,
          }),
        })
        if (!response.ok) throw new Error('優待情報の保存に失敗しました')
        window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
          detail: {
            type: 'benefit' as const,
            symbol: stockId.replace('stock-', ''),
            benefit: {
              description: val.description || null,
              minimumShares: val.minimumShares ? parseInt(val.minimumShares) : null,
              estimatedValue: val.estimatedValue ? parseFloat(val.estimatedValue) : null,
              rightsMonth: val.rightsSettings.month,
              rightsDay: val.rightsSettings.day,
            }
          }
        }))
      })
    },
  })

  const updateDescription = useCallback((value: string) => {
    setState(prev => ({ ...prev, description: value }))
    markDirty()
  }, [markDirty])

  const updateMinimumShares = useCallback((value: string) => {
    setState(prev => ({ ...prev, minimumShares: value }))
    markDirty()
  }, [markDirty])

  const updateEstimatedValue = useCallback((value: string) => {
    setState(prev => ({ ...prev, estimatedValue: value }))
    markDirty()
  }, [markDirty])

  const updateRightsSettings = useCallback((settings: ShareholderRightsSettings) => {
    setState(prev => ({ ...prev, rightsSettings: settings }))
    markDirty()
  }, [markDirty])

  return {
    description: state.description,
    minimumShares: state.minimumShares,
    estimatedValue: state.estimatedValue,
    rightsSettings: state.rightsSettings,
    isLoading,
    isSaving,
    updateDescription,
    updateMinimumShares,
    updateEstimatedValue,
    updateRightsSettings,
  }
}
