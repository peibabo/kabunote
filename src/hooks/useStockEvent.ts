import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import {
  ShareholderMeetingSettings,
  createDefaultShareholderMeetingSettings
} from '@/types/rightsDate'

interface UseStockEventReturn {
  earningsDate: string
  shareholderMeetingSettings: ShareholderMeetingSettings
  isLoading: boolean
  isSaving: boolean
  updateEarningsDate: (date: string) => void
  updateShareholderMeetingSettings: (settings: ShareholderMeetingSettings) => void
}

export function useStockEvent(stockId: string): UseStockEventReturn {
  const symbol = stockId.replace('stock-', '')

  const [earningsDate, setEarningsDate] = useState<string>('')
  const [shareholderMeetingSettings, setShareholderMeetingSettings] =
    useState<ShareholderMeetingSettings>(createDefaultShareholderMeetingSettings())

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [hasEarningsInput, setHasEarningsInput] = useState(false)
  const [hasMeetingInput, setHasMeetingInput] = useState(false)

  const debouncedEarningsDate = useDebounce(earningsDate, 500)
  const debouncedMeetingSettings = useDebounce(shareholderMeetingSettings, 500)

  // DB からの読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/event`)

      if (!response.ok) {
        throw new Error('イベントの読み込みに失敗しました')
      }

      const result = await response.json()

      if (result.success) {
        const { earnings, shareholderMeeting } = result.data

        setEarningsDate(earnings?.eventDate ?? '')

        if (shareholderMeeting) {
          setShareholderMeetingSettings({
            month: shareholderMeeting.eventMonth ?? null,
            day: shareholderMeeting.eventDay ?? null,
            isRecurring: shareholderMeeting.isRecurring ?? true,
            isActive: shareholderMeeting.isActive ?? false,
          })
        } else {
          setShareholderMeetingSettings(createDefaultShareholderMeetingSettings())
        }
      }
    } catch (err) {
      console.error('❌ イベント読み込みエラー:', err)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // 初回読み込み
  useEffect(() => {
    loadFromDatabase()
  }, [loadFromDatabase])

  // 決算日の DB 保存
  const saveEarningsToDatabase = useCallback(async (date: string) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/stocks/${stockId}/event`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'EARNINGS', eventDate: date || null }),
      })

      if (!response.ok) {
        throw new Error('決算日の保存に失敗しました')
      }

      if (typeof window !== 'undefined') {
        const result = await response.json()
        if (result.success) {
          window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
            detail: {
              type: 'event' as const,
              symbol,
              eventType: 'EARNINGS',
              eventData: {
                id: result.data.id,
                eventType: 'EARNINGS',
                eventDate: result.data.eventDate,
                eventMonth: null,
                eventDay: null,
                isRecurring: false,
                isActive: true,
              }
            }
          }))
        }
      }
    } catch (err) {
      console.error('❌ 決算日保存エラー:', err)
    } finally {
      setIsSaving(false)
      setHasEarningsInput(false)
    }
  }, [stockId, symbol])

  // 株主総会設定の DB 保存
  const saveMeetingToDatabase = useCallback(async (settings: ShareholderMeetingSettings) => {
    try {
      setIsSaving(true)
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

      if (!response.ok) {
        throw new Error('株主総会設定の保存に失敗しました')
      }

      if (typeof window !== 'undefined') {
        const result = await response.json()
        if (result.success) {
          window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
            detail: {
              type: 'event' as const,
              symbol,
              eventType: 'SHAREHOLDER_MEETING',
              eventData: {
                id: result.data.id,
                eventType: 'SHAREHOLDER_MEETING',
                eventDate: null,
                eventMonth: result.data.eventMonth,
                eventDay: result.data.eventDay,
                isRecurring: result.data.isRecurring,
                isActive: result.data.isActive,
              }
            }
          }))
        }
      }
    } catch (err) {
      console.error('❌ 株主総会設定保存エラー:', err)
    } finally {
      setIsSaving(false)
      setHasMeetingInput(false)
    }
  }, [stockId, symbol])

  // 決算日の自動保存（デバウンス後）
  useEffect(() => {
    if (!hasEarningsInput || isLoading) return
    saveEarningsToDatabase(debouncedEarningsDate)
  }, [debouncedEarningsDate, hasEarningsInput, isLoading, saveEarningsToDatabase])

  // 株主総会設定の自動保存（デバウンス後）
  useEffect(() => {
    if (!hasMeetingInput || isLoading) return
    saveMeetingToDatabase(debouncedMeetingSettings)
  }, [debouncedMeetingSettings, hasMeetingInput, isLoading, saveMeetingToDatabase])

  const updateEarningsDate = useCallback((date: string) => {
    setEarningsDate(date)
    setHasEarningsInput(true)
  }, [])

  const updateShareholderMeetingSettings = useCallback((settings: ShareholderMeetingSettings) => {
    setShareholderMeetingSettings(settings)
    setHasMeetingInput(true)
  }, [])

  return {
    earningsDate,
    shareholderMeetingSettings,
    isLoading,
    isSaving,
    updateEarningsDate,
    updateShareholderMeetingSettings,
  }
}
