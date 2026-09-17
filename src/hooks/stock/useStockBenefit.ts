import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { useAutoSave } from '../util/useAutoSave'
import { grantXp } from '@/lib/gamification'
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'
import { ShareholderRightsSettings, createDefaultRightsSettings } from '@/types/rightsDate'

interface BenefitState {
  description: string
  minimumShares: string
  estimatedValue: string
  rightsSettings: ShareholderRightsSettings
}

interface UseStockBenefitOptions {
  initialData?: {
    description: string | null
    minimumShares: number | null
    estimatedValue: number | null
    rightsMonth: number | null
    rightsDay: number | null
  } | null
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

function parseInitialBenefit(data: NonNullable<UseStockBenefitOptions['initialData']>): BenefitState {
  return {
    description: data.description ?? '',
    minimumShares: data.minimumShares != null ? String(data.minimumShares) : '',
    estimatedValue: data.estimatedValue != null ? String(data.estimatedValue) : '',
    rightsSettings: data.rightsMonth != null && data.rightsDay != null
      ? { month: data.rightsMonth, day: data.rightsDay, isRecurring: true, isActive: true }
      : createDefaultRightsSettings(),
  }
}

export function useStockBenefit(stockId: string, options?: UseStockBenefitOptions): UseStockBenefitReturn {
  const hasInitialData = options?.initialData !== undefined
  const [state, setState] = useState<BenefitState>(() =>
    options?.initialData ? parseInitialBenefit(options.initialData) : {
      description: '',
      minimumShares: '',
      estimatedValue: '',
      rightsSettings: createDefaultRightsSettings(),
    }
  )
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(!hasInitialData)

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
          : createDefaultRightsSettings(),
      })
    }
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadData() }, [loadData, hasInitialData])

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
        emitAppEvent(APP_EVENTS.DB_CALENDAR_UPDATE, {
          type: 'benefit',
          symbol: stockId.replace('stock-', ''),
          benefit: {
            description: val.description || null,
            minimumShares: val.minimumShares ? parseInt(val.minimumShares) : null,
            estimatedValue: val.estimatedValue ? parseFloat(val.estimatedValue) : null,
            rightsMonth: val.rightsSettings.month,
            rightsDay: val.rightsSettings.day,
          }
        })
        grantXp('BENEFIT_REGISTER')
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
