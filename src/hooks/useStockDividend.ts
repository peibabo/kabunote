import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { useAutoSave } from './useAutoSave'
import { DividendRightsSettings, createDefaultRightsSettings } from '@/types/rightsDate'

interface DividendState {
  dividendPerShare: string
  dividendFrequency: 1 | 2 | 4
  dividendRightsSettings: DividendRightsSettings
}

interface UseStockDividendOptions {
  initialData?: {
    dividendPerShare: number | null
    frequency: number
    rightsMonth: number | null
    rightsDay: number | null
  }
}

interface UseStockDividendReturn {
  dividendPerShare: string
  dividendFrequency: 1 | 2 | 4
  dividendRightsSettings: DividendRightsSettings
  isLoading: boolean
  isSaving: boolean
  updateDividendPerShare: (value: string) => void
  updateDividendFrequency: (value: 1 | 2 | 4) => void
  updateDividendRightsSettings: (settings: DividendRightsSettings) => void
}

function parseInitialDividend(data: NonNullable<UseStockDividendOptions['initialData']>): DividendState {
  const freq = (data.frequency === 2 || data.frequency === 4) ? data.frequency : 1
  return {
    dividendPerShare: data.dividendPerShare != null ? String(data.dividendPerShare) : '',
    dividendFrequency: freq as 1 | 2 | 4,
    dividendRightsSettings: data.rightsMonth != null && data.rightsDay != null
      ? { month: data.rightsMonth, day: data.rightsDay, isRecurring: true, isActive: true }
      : createDefaultRightsSettings(),
  }
}

export function useStockDividend(stockId: string, options?: UseStockDividendOptions): UseStockDividendReturn {
  const hasInitialData = options?.initialData !== undefined
  const [state, setState] = useState<DividendState>(() =>
    options?.initialData ? parseInitialDividend(options.initialData) : {
      dividendPerShare: '',
      dividendFrequency: 1,
      dividendRightsSettings: createDefaultRightsSettings(),
    }
  )
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadData = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{
      dividendPerShare: number | null; frequency: number; rightsMonth: number | null; rightsDay: number | null
    }>(`/api/stocks/${stockId}/dividend`)
    if (data) {
      const freq = (data.frequency === 2 || data.frequency === 4) ? data.frequency : 1
      setState({
        dividendPerShare: data.dividendPerShare != null ? String(data.dividendPerShare) : '',
        dividendFrequency: freq as 1 | 2 | 4,
        dividendRightsSettings: data.rightsMonth != null && data.rightsDay != null
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
        const response = await fetch(`/api/stocks/${stockId}/dividend`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dividendPerShare: val.dividendPerShare ? parseFloat(val.dividendPerShare) : null,
            frequency: val.dividendFrequency,
            rightsMonth: val.dividendRightsSettings.month,
            rightsDay: val.dividendRightsSettings.day,
          }),
        })
        if (!response.ok) throw new Error('配当情報の保存に失敗しました')
        window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
          detail: {
            type: 'dividend' as const,
            symbol: stockId.replace('stock-', ''),
            dividend: {
              dividendPerShare: val.dividendPerShare ? parseFloat(val.dividendPerShare) : null,
              frequency: val.dividendFrequency,
              rightsMonth: val.dividendRightsSettings.month,
              rightsDay: val.dividendRightsSettings.day,
            }
          }
        }))
      })
    },
  })

  const updateDividendPerShare = useCallback((value: string) => {
    setState(prev => ({ ...prev, dividendPerShare: value }))
    markDirty()
  }, [markDirty])

  const updateDividendFrequency = useCallback((value: 1 | 2 | 4) => {
    setState(prev => ({ ...prev, dividendFrequency: value }))
    markDirty()
  }, [markDirty])

  const updateDividendRightsSettings = useCallback((settings: DividendRightsSettings) => {
    setState(prev => ({ ...prev, dividendRightsSettings: settings }))
    markDirty()
  }, [markDirty])

  return {
    dividendPerShare: state.dividendPerShare,
    dividendFrequency: state.dividendFrequency,
    dividendRightsSettings: state.dividendRightsSettings,
    isLoading,
    isSaving,
    updateDividendPerShare,
    updateDividendFrequency,
    updateDividendRightsSettings,
  }
}
