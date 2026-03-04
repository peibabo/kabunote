import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { DividendRightsSettings, createDefaultDividendRightsSettings } from '@/types/rightsDate'

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
  const [dividendPerShare, setDividendPerShare] = useState<string>('')
  const [dividendFrequency, setDividendFrequency] = useState<1 | 2 | 4>(1)
  const [dividendRightsSettings, setDividendRightsSettings] =
    useState<DividendRightsSettings>(createDefaultDividendRightsSettings())

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasDividendInput, setHasDividendInput] = useState(false)

  const debouncedPerShare = useDebounce(dividendPerShare, 500)
  const debouncedFrequency = useDebounce(dividendFrequency, 500)
  const debouncedRightsSettings = useDebounce(dividendRightsSettings, 500)

  // DB からの読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/dividend`)

      if (!response.ok) {
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
      }
    } catch (err) {
      console.error('❌ 配当情報読み込みエラー:', err)
    } finally {
      setIsLoading(false)
    }
  }, [stockId])

  // 初回読み込み
  useEffect(() => {
    loadFromDatabase()
  }, [loadFromDatabase])

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

      if (!response.ok) {
        throw new Error('配当情報の保存に失敗しました')
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
          detail: {
            type: 'dividend' as const,
            symbol: stockId.replace('stock-', ''),
            dividend: {
              dividendPerShare: perShare ? parseFloat(perShare) : null,
              frequency: freq,
              rightsMonth: rights.month,
              rightsDay: rights.day,
            }
          }
        }))
      }
    } catch (err) {
      console.error('❌ 配当情報保存エラー:', err)
    } finally {
      setIsSaving(false)
      setHasDividendInput(false)
    }
  }, [stockId])

  // 自動保存（デバウンス後）
  useEffect(() => {
    if (!hasDividendInput || isLoading) return
    saveToDatabaseWithValues(debouncedPerShare, debouncedFrequency, debouncedRightsSettings)
  }, [
    debouncedPerShare, debouncedFrequency, debouncedRightsSettings,
    hasDividendInput, isLoading,
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
