import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
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
  // stockId: "stock-7203" 形式 → symbol: "7203"
  const symbol = stockId.replace('stock-', '')
  const earningsKey = `kabunote-earnings-date-${symbol}`
  const meetingKey = `kabunote-shareholder-meeting-${symbol}`

  const [earningsDate, setEarningsDate] = useState<string>('')
  const [shareholderMeetingSettings, setShareholderMeetingSettings] =
    useState<ShareholderMeetingSettings>(createDefaultShareholderMeetingSettings())

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [hasEarningsInput, setHasEarningsInput] = useState(false)
  const [hasMeetingInput, setHasMeetingInput] = useState(false)

  const debouncedEarningsDate = useDebounce(earningsDate, 500)
  const debouncedMeetingSettings = useDebounce(shareholderMeetingSettings, 500)

  // 認証状態を監視
  useEffect(() => {
    const supabase = createClient()

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // localStorage からの読み込みヘルパー
  const loadFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return

    const storedEarnings = localStorage.getItem(earningsKey)
    if (storedEarnings !== null) {
      setEarningsDate(storedEarnings)
    }

    const storedMeeting = localStorage.getItem(meetingKey)
    if (storedMeeting !== null) {
      try {
        const parsed = JSON.parse(storedMeeting)
        if (parsed && typeof parsed === 'object') {
          setShareholderMeetingSettings({
            month: typeof parsed.month === 'number' ? parsed.month : null,
            day: typeof parsed.day === 'number' ? parsed.day : null,
            isRecurring: typeof parsed.isRecurring === 'boolean' ? parsed.isRecurring : true,
            isActive: typeof parsed.isActive === 'boolean' ? parsed.isActive : false,
          })
        }
      } catch {
        // パースエラーはデフォルト値のまま
      }
    }
  }, [earningsKey, meetingKey])

  // DB からの読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/event`)

      if (!response.ok) {
        if (response.status === 401) {
          loadFromLocalStorage()
          return
        }
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
    } catch {
      // エラー時は localStorage にフォールバック
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }, [stockId, loadFromLocalStorage])

  // 初回読み込み
  useEffect(() => {
    if (!isLoggedIn) {
      loadFromLocalStorage()
      setIsLoading(false)
      return
    }
    loadFromDatabase()
  }, [isLoggedIn, loadFromDatabase, loadFromLocalStorage])

  // 決算日の DB 保存
  const saveEarningsToDatabase = useCallback(async (date: string) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/stocks/${stockId}/event`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: 'EARNINGS', eventDate: date || null }),
      })

      if (!response.ok && response.status !== 401) {
        throw new Error('決算日の保存に失敗しました')
      }
    } catch {
      // エラー時は localStorage にフォールバック保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(earningsKey, date)
      }
    } finally {
      setIsSaving(false)
      setHasEarningsInput(false)
    }
  }, [stockId, earningsKey])

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

      if (!response.ok && response.status !== 401) {
        throw new Error('株主総会設定の保存に失敗しました')
      }
    } catch {
      // エラー時は localStorage にフォールバック保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(meetingKey, JSON.stringify(settings))
      }
    } finally {
      setIsSaving(false)
      setHasMeetingInput(false)
    }
  }, [stockId, meetingKey])

  // 決算日の自動保存（デバウンス後）
  useEffect(() => {
    if (!hasEarningsInput || isLoading) return

    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(earningsKey, debouncedEarningsDate)
      }
      setHasEarningsInput(false)
      return
    }

    saveEarningsToDatabase(debouncedEarningsDate)
  }, [debouncedEarningsDate, hasEarningsInput, isLoading, isLoggedIn, earningsKey, saveEarningsToDatabase])

  // 株主総会設定の自動保存（デバウンス後）
  useEffect(() => {
    if (!hasMeetingInput || isLoading) return

    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(meetingKey, JSON.stringify(debouncedMeetingSettings))
      }
      setHasMeetingInput(false)
      return
    }

    saveMeetingToDatabase(debouncedMeetingSettings)
  }, [debouncedMeetingSettings, hasMeetingInput, isLoading, isLoggedIn, meetingKey, saveMeetingToDatabase])

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
