import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from './useAsyncState'
import { useAutoSave } from './useAutoSave'
import { DividendRightsSettings, createDefaultDividendRightsSettings } from '@/types/rightsDate'

interface DividendState {
  dividendPerShare: string
  dividendFrequency: 1 | 2 | 4
  dividendRightsSettings: DividendRightsSettings
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

export function useStockDividend(stockId: string): UseStockDividendReturn {
  const [state, setState] = useState<DividendState>({
    dividendPerShare: '',
    dividendFrequency: 1,
    dividendRightsSettings: createDefaultDividendRightsSettings(),
  })
  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState()

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
          : createDefaultDividendRightsSettings(),
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
