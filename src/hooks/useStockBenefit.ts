import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './useDebounce'
import { ShareholderRightsSettings, createDefaultShareholderRightsSettings } from '@/types/rightsDate'

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
  const [description, setDescription] = useState<string>('')
  const [minimumShares, setMinimumShares] = useState<string>('')
  const [estimatedValue, setEstimatedValue] = useState<string>('')
  const [rightsSettings, setRightsSettings] = useState<ShareholderRightsSettings>(
    createDefaultShareholderRightsSettings()
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasBenefitInput, setHasBenefitInput] = useState(false)

  const debouncedDescription = useDebounce(description, 500)
  const debouncedMinimumShares = useDebounce(minimumShares, 500)
  const debouncedEstimatedValue = useDebounce(estimatedValue, 500)
  const debouncedRightsSettings = useDebounce(rightsSettings, 500)

  // DB からの読み込み
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/benefit`)

      if (!response.ok) {
        throw new Error('優待情報の読み込みに失敗しました')
      }

      const result = await response.json()

      if (result.success && result.data) {
        const { description: dbDesc, minimumShares: dbMin, estimatedValue: dbEst, rightsMonth, rightsDay } = result.data

        setDescription(dbDesc ?? '')
        setMinimumShares(dbMin != null ? String(dbMin) : '')
        setEstimatedValue(dbEst != null ? String(dbEst) : '')
        setRightsSettings(
          rightsMonth != null && rightsDay != null
            ? { month: rightsMonth, day: rightsDay, isRecurring: true, isActive: true }
            : createDefaultShareholderRightsSettings()
        )
      }
    } catch (err) {
      console.error('❌ 優待情報読み込みエラー:', err)
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
    desc: string,
    min: string,
    est: string,
    rights: ShareholderRightsSettings
  ) => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/stocks/${stockId}/benefit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: desc || null,
          minimumShares: min ? parseInt(min) : null,
          estimatedValue: est ? parseFloat(est) : null,
          rightsMonth: rights.month,
          rightsDay: rights.day,
        }),
      })

      if (!response.ok) {
        throw new Error('優待情報の保存に失敗しました')
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update', {
          detail: {
            type: 'benefit' as const,
            symbol: stockId.replace('stock-', ''),
            benefit: {
              description: desc || null,
              minimumShares: min ? parseInt(min) : null,
              estimatedValue: est ? parseFloat(est) : null,
              rightsMonth: rights.month,
              rightsDay: rights.day,
            }
          }
        }))
      }
    } catch (err) {
      console.error('❌ 優待情報保存エラー:', err)
    } finally {
      setIsSaving(false)
      setHasBenefitInput(false)
    }
  }, [stockId])

  // 自動保存（デバウンス後）
  useEffect(() => {
    if (!hasBenefitInput || isLoading) return

    saveToDatabaseWithValues(
      debouncedDescription,
      debouncedMinimumShares,
      debouncedEstimatedValue,
      debouncedRightsSettings
    )
  }, [
    debouncedDescription, debouncedMinimumShares, debouncedEstimatedValue, debouncedRightsSettings,
    hasBenefitInput, isLoading,
    saveToDatabaseWithValues,
  ])

  const updateDescription = useCallback((value: string) => {
    setDescription(value)
    setHasBenefitInput(true)
  }, [])

  const updateMinimumShares = useCallback((value: string) => {
    setMinimumShares(value)
    setHasBenefitInput(true)
  }, [])

  const updateEstimatedValue = useCallback((value: string) => {
    setEstimatedValue(value)
    setHasBenefitInput(true)
  }, [])

  const updateRightsSettings = useCallback((settings: ShareholderRightsSettings) => {
    setRightsSettings(settings)
    setHasBenefitInput(true)
  }, [])

  return {
    description,
    minimumShares,
    estimatedValue,
    rightsSettings,
    isLoading,
    isSaving,
    updateDescription,
    updateMinimumShares,
    updateEstimatedValue,
    updateRightsSettings,
  }
}
