import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/apiClient'
import { useAsyncState } from '../util/useAsyncState'
import { useAutoSave } from '../util/useAutoSave'
import {
  ShareholderMeetingSettings,
  createDefaultRightsSettings
} from '@/types/rightsDate'

interface UseStockEventReturn {
  earningsDate: string
  shareholderMeetingSettings: ShareholderMeetingSettings
  isLoading: boolean
  isSaving: boolean
  updateEarningsDate: (date: string) => void
  updateShareholderMeetingSettings: (settings: ShareholderMeetingSettings) => void
}

interface UseStockEventOptions {
  initialData?: {
    earnings: { eventDate: string | null } | null
    shareholderMeeting: { eventMonth: number | null; eventDay: number | null; isRecurring: boolean; isActive: boolean } | null
  }
}

export function useStockEvent(stockId: string, options?: UseStockEventOptions): UseStockEventReturn {
  const hasInitialData = options?.initialData !== undefined
  const symbol = stockId.replace('stock-', '')

  const [earningsDate, setEarningsDate] = useState<string>(() => {
    if (options?.initialData) return options.initialData.earnings?.eventDate ?? ''
    return ''
  })
  const [meetingSettings, setMeetingSettings] =
    useState<ShareholderMeetingSettings>(() => {
      if (options?.initialData?.shareholderMeeting) {
        const m = options.initialData.shareholderMeeting
        return { month: m.eventMonth ?? null, day: m.eventDay ?? null, isRecurring: m.isRecurring ?? true, isActive: m.isActive ?? false }
      }
      return createDefaultRightsSettings()
    })

  const { isLoading, isSaving, withLoading, withSaving } = useAsyncState(!hasInitialData)

  const loadData = useCallback(() => withLoading(async () => {
    const data = await apiFetch<{
      earnings: { eventDate: string | null } | null
      shareholderMeeting: { eventMonth: number | null; eventDay: number | null; isRecurring: boolean; isActive: boolean } | null
    }>(`/api/stocks/${stockId}/event`)
    setEarningsDate(data.earnings?.eventDate ?? '')
    if (data.shareholderMeeting) {
      setMeetingSettings({
        month: data.shareholderMeeting.eventMonth ?? null,
        day: data.shareholderMeeting.eventDay ?? null,
        isRecurring: data.shareholderMeeting.isRecurring ?? true,
        isActive: data.shareholderMeeting.isActive ?? false,
      })
    } else {
      setMeetingSettings(createDefaultRightsSettings())
    }
  }), [stockId, withLoading])

  useEffect(() => { if (!hasInitialData) loadData() }, [loadData, hasInitialData])

  // 決算日の自動保存
  const { markDirty: markEarningsDirty } = useAutoSave({
    value: earningsDate,
    delay: 500,
    isLoading,
    onSave: async (date) => {
      await withSaving(async () => {
        const response = await fetch(`/api/stocks/${stockId}/event`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventType: 'EARNINGS', eventDate: date || null }),
        })
        if (!response.ok) throw new Error('決算日の保存に失敗しました')
        const result = await response.json()
        if (result.success) {
          window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
            detail: {
              type: 'event' as const, symbol, eventType: 'EARNINGS',
              eventData: {
                id: result.data.id, eventType: 'EARNINGS', eventDate: result.data.eventDate,
                eventMonth: null, eventDay: null, isRecurring: false, isActive: true,
              }
            }
          }))
        }
      })
    },
  })

  // 株主総会設定の自動保存
  const { markDirty: markMeetingDirty } = useAutoSave({
    value: meetingSettings,
    delay: 500,
    isLoading,
    onSave: async (settings) => {
      await withSaving(async () => {
        const response = await fetch(`/api/stocks/${stockId}/event`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'SHAREHOLDER_MEETING',
            eventMonth: settings.month,
            eventDay: settings.day,
            isRecurring: settings.isRecurring,
            isActive: settings.isActive,
          }),
        })
        if (!response.ok) throw new Error('株主総会設定の保存に失敗しました')
        const result = await response.json()
        if (result.success) {
          window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
            detail: {
              type: 'event' as const, symbol, eventType: 'SHAREHOLDER_MEETING',
              eventData: {
                id: result.data.id, eventType: 'SHAREHOLDER_MEETING', eventDate: null,
                eventMonth: result.data.eventMonth, eventDay: result.data.eventDay,
                isRecurring: result.data.isRecurring, isActive: result.data.isActive,
              }
            }
          }))
        }
      })
    },
  })

  const updateEarningsDate = useCallback((date: string) => {
    setEarningsDate(date)
    markEarningsDirty()
  }, [markEarningsDirty])

  const updateShareholderMeetingSettings = useCallback((settings: ShareholderMeetingSettings) => {
    setMeetingSettings(settings)
    markMeetingDirty()
  }, [markMeetingDirty])

  return {
    earningsDate,
    shareholderMeetingSettings: meetingSettings,
    isLoading,
    isSaving,
    updateEarningsDate,
    updateShareholderMeetingSettings,
  }
}
