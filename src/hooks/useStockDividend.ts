import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useDebounce } from './useDebounce'
import { DividendRightsSettings, createDefaultDividendRightsSettings } from '@/types/rightsDate'
import { stockKey } from '@/lib/storageKeys'

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
  // stockId: "stock-7203" 形式 → symbol: "7203"
  const symbol = stockId.replace('stock-', '')
  const perShareKey = stockKey.dividendPerShare(symbol)
  const frequencyKey = stockKey.dividendFrequency(symbol)
  const rightsKey = stockKey.dividendRightsSettings(symbol)

  const [dividendPerShare, setDividendPerShare] = useState<string>('')
  const [dividendFrequency, setDividendFrequency] = useState<1 | 2 | 4>(1)
  const [dividendRightsSettings, setDividendRightsSettings] =
    useState<DividendRightsSettings>(createDefaultDividendRightsSettings())

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasDividendInput, setHasDividendInput] = useState(false)

  const debouncedPerShare = useDebounce(dividendPerShare, 500)
  const debouncedFrequency = useDebounce(dividendFrequency, 500)
  const debouncedRightsSettings = useDebounce(dividendRightsSettings, 500)

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

    const storedPerShare = localStorage.getItem(perShareKey)
    if (storedPerShare !== null) {
      setDividendPerShare(storedPerShare)
    }

    const storedFrequency = localStorage.getItem(frequencyKey)
    if (storedFrequency !== null) {
      const freq = parseInt(storedFrequency) as 1 | 2 | 4
      if (freq === 1 || freq === 2 || freq === 4) {
        setDividendFrequency(freq)
      }
    }

    const storedRights = localStorage.getItem(rightsKey)
    if (storedRights !== null) {
      try {
        const parsed = JSON.parse(storedRights)
        if (parsed && typeof parsed === 'object') {
          setDividendRightsSettings({
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
  }, [perShareKey, frequencyKey, rightsKey])

  // DB からの読み込み（localStorage → DB 自動移行）
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/dividend`)

      if (!response.ok) {
        if (response.status === 401) {
          loadFromLocalStorage()
          return
        }
        throw new Error('配当情報の読み込みに失敗しました')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const { dividendPerShare: dbPerShare, frequency: dbFreq, rightsMonth, rightsDay } = result.data

        setDividendPerShare(dbPerShare != null ? String(dbPerShare) : '')
        const freq = (dbFreq === 2 || dbFreq === 4) ? dbFreq : 1
        setDividendFrequency(freq as 1 | 2 | 4)
        setDividendRightsSettings(
          rightsMonth != null && rightsDay != null
            ? { month: rightsMonth, day: rightsDay, isRecurring: true, isActive: true }
            : createDefaultDividendRightsSettings()
        )
      } else {
        // DB に未登録 → localStorage から移行
        const localPerShare = typeof window !== 'undefined' ? localStorage.getItem(perShareKey) : null
        const localFreq = typeof window !== 'undefined' ? localStorage.getItem(frequencyKey) : null
        const localRights = typeof window !== 'undefined' ? localStorage.getItem(rightsKey) : null

        if (localPerShare || localFreq || localRights) {
          const perShare = localPerShare || ''
          const freq = localFreq ? (parseInt(localFreq) as 1 | 2 | 4) : 1
          let rights = createDefaultDividendRightsSettings()
          if (localRights) {
            try {
              const parsed = JSON.parse(localRights)
              if (parsed && typeof parsed === 'object') {
                rights = {
                  month: typeof parsed.month === 'number' ? parsed.month : null,
                  day: typeof parsed.day === 'number' ? parsed.day : null,
                  isRecurring: typeof parsed.isRecurring === 'boolean' ? parsed.isRecurring : true,
                  isActive: typeof parsed.isActive === 'boolean' ? parsed.isActive : false,
                }
              }
            } catch { /* デフォルト値を使用 */ }
          }

          setDividendPerShare(perShare)
          setDividendFrequency((freq === 2 || freq === 4) ? freq : 1)
          setDividendRightsSettings(rights)

          // DB に移行保存
          await fetch(`/api/stocks/${stockId}/dividend`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dividendPerShare: perShare ? parseFloat(perShare) : null,
              frequency: (freq === 2 || freq === 4) ? freq : 1,
              rightsMonth: rights.month,
              rightsDay: rights.day,
            }),
          })

          // 移行後 localStorage を削除
          localStorage.removeItem(perShareKey)
          localStorage.removeItem(frequencyKey)
          localStorage.removeItem(rightsKey)
        }
      }
    } catch {
      // エラー時は localStorage にフォールバック
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }, [stockId, perShareKey, frequencyKey, rightsKey, loadFromLocalStorage])

  // 初回読み込み
  useEffect(() => {
    if (!isLoggedIn) {
      loadFromLocalStorage()
      setIsLoading(false)
      return
    }
    loadFromDatabase()
  }, [isLoggedIn, loadFromDatabase, loadFromLocalStorage])

  // DB 保存
  const saveToDatabaseWithValues = useCallback(async (
    perShare: string,
    freq: 1 | 2 | 4,
    rights: DividendRightsSettings
  ) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/stocks/${stockId}/dividend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dividendPerShare: perShare ? parseFloat(perShare) : null,
          frequency: freq,
          rightsMonth: rights.month,
          rightsDay: rights.day,
        }),
      })

      if (!response.ok && response.status !== 401) {
        throw new Error('配当情報の保存に失敗しました')
      }
      // カレンダーデータの再取得をトリガー
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update'))
      }
    } catch {
      // エラー時は localStorage にフォールバック保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(perShareKey, perShare)
        localStorage.setItem(frequencyKey, String(freq))
        localStorage.setItem(rightsKey, JSON.stringify(rights))
      }
    } finally {
      setIsSaving(false)
      setHasDividendInput(false)
    }
  }, [stockId, perShareKey, frequencyKey, rightsKey])

  // 自動保存（デバウンス後）
  useEffect(() => {
    if (!hasDividendInput || isLoading) return

    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(perShareKey, debouncedPerShare)
        localStorage.setItem(frequencyKey, String(debouncedFrequency))
        localStorage.setItem(rightsKey, JSON.stringify(debouncedRightsSettings))
      }
      setHasDividendInput(false)
      return
    }

    saveToDatabaseWithValues(debouncedPerShare, debouncedFrequency, debouncedRightsSettings)
  }, [
    debouncedPerShare, debouncedFrequency, debouncedRightsSettings,
    hasDividendInput, isLoading, isLoggedIn,
    perShareKey, frequencyKey, rightsKey,
    saveToDatabaseWithValues,
  ])

  const updateDividendPerShare = useCallback((value: string) => {
    setDividendPerShare(value)
    setHasDividendInput(true)
  }, [])

  const updateDividendFrequency = useCallback((value: 1 | 2 | 4) => {
    setDividendFrequency(value)
    setHasDividendInput(true)
  }, [])

  const updateDividendRightsSettings = useCallback((settings: DividendRightsSettings) => {
    setDividendRightsSettings(settings)
    setHasDividendInput(true)
  }, [])

  return {
    dividendPerShare,
    dividendFrequency,
    dividendRightsSettings,
    isLoading,
    isSaving,
    updateDividendPerShare,
    updateDividendFrequency,
    updateDividendRightsSettings,
  }
}
