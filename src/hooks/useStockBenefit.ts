import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase-client'
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
  // stockId: "stock-7203" 形式 → symbol: "7203"
  const symbol = stockId.replace('stock-', '')
  const descriptionKey = `kabunote-benefit-description-${symbol}`
  const minimumSharesKey = `kabunote-minimum-shares-${symbol}`
  const estimatedValueKey = `kabunote-estimated-value-${symbol}`
  const rightsKey = `kabunote-shareholder-rights-settings-${symbol}`

  const [description, setDescription] = useState<string>('')
  const [minimumShares, setMinimumShares] = useState<string>('')
  const [estimatedValue, setEstimatedValue] = useState<string>('')
  const [rightsSettings, setRightsSettings] = useState<ShareholderRightsSettings>(
    createDefaultShareholderRightsSettings()
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [hasBenefitInput, setHasBenefitInput] = useState(false)

  const debouncedDescription = useDebounce(description, 500)
  const debouncedMinimumShares = useDebounce(minimumShares, 500)
  const debouncedEstimatedValue = useDebounce(estimatedValue, 500)
  const debouncedRightsSettings = useDebounce(rightsSettings, 500)

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

    const storedDesc = localStorage.getItem(descriptionKey)
    if (storedDesc !== null) setDescription(storedDesc)

    const storedMin = localStorage.getItem(minimumSharesKey)
    if (storedMin !== null) setMinimumShares(storedMin)

    const storedEst = localStorage.getItem(estimatedValueKey)
    if (storedEst !== null) setEstimatedValue(storedEst)

    const storedRights = localStorage.getItem(rightsKey)
    if (storedRights !== null) {
      try {
        const parsed = JSON.parse(storedRights)
        if (parsed && typeof parsed === 'object') {
          setRightsSettings({
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
  }, [descriptionKey, minimumSharesKey, estimatedValueKey, rightsKey])

  // DB からの読み込み（localStorage → DB 自動移行）
  const loadFromDatabase = useCallback(async () => {
    try {
      const response = await fetch(`/api/stocks/${stockId}/benefit`)

      if (!response.ok) {
        if (response.status === 401) {
          loadFromLocalStorage()
          return
        }
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
      } else {
        // DB に未登録 → localStorage から移行
        const localDesc = typeof window !== 'undefined' ? localStorage.getItem(descriptionKey) : null
        const localMin = typeof window !== 'undefined' ? localStorage.getItem(minimumSharesKey) : null
        const localEst = typeof window !== 'undefined' ? localStorage.getItem(estimatedValueKey) : null
        const localRights = typeof window !== 'undefined' ? localStorage.getItem(rightsKey) : null

        if (localDesc || localMin || localEst || localRights) {
          const desc = localDesc || ''
          const min = localMin || ''
          const est = localEst || ''
          let rights = createDefaultShareholderRightsSettings()
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

          setDescription(desc)
          setMinimumShares(min)
          setEstimatedValue(est)
          setRightsSettings(rights)

          // DB に移行保存
          await fetch(`/api/stocks/${stockId}/benefit`, {
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

          // 移行後 localStorage を削除
          localStorage.removeItem(descriptionKey)
          localStorage.removeItem(minimumSharesKey)
          localStorage.removeItem(estimatedValueKey)
          localStorage.removeItem(rightsKey)
        }
      }
    } catch {
      // エラー時は localStorage にフォールバック
      loadFromLocalStorage()
    } finally {
      setIsLoading(false)
    }
  }, [stockId, descriptionKey, minimumSharesKey, estimatedValueKey, rightsKey, loadFromLocalStorage])

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

      if (!response.ok && response.status !== 401) {
        throw new Error('優待情報の保存に失敗しました')
      }
      // カレンダーデータの再取得をトリガー
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update'))
      }
    } catch {
      // エラー時は localStorage にフォールバック保存
      if (typeof window !== 'undefined') {
        localStorage.setItem(descriptionKey, desc)
        localStorage.setItem(minimumSharesKey, min)
        localStorage.setItem(estimatedValueKey, est)
        localStorage.setItem(rightsKey, JSON.stringify(rights))
      }
    } finally {
      setIsSaving(false)
      setHasBenefitInput(false)
    }
  }, [stockId, descriptionKey, minimumSharesKey, estimatedValueKey, rightsKey])

  // 自動保存（デバウンス後）
  useEffect(() => {
    if (!hasBenefitInput || isLoading) return

    if (!isLoggedIn) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(descriptionKey, debouncedDescription)
        localStorage.setItem(minimumSharesKey, debouncedMinimumShares)
        localStorage.setItem(estimatedValueKey, debouncedEstimatedValue)
        localStorage.setItem(rightsKey, JSON.stringify(debouncedRightsSettings))
      }
      setHasBenefitInput(false)
      return
    }

    saveToDatabaseWithValues(
      debouncedDescription,
      debouncedMinimumShares,
      debouncedEstimatedValue,
      debouncedRightsSettings
    )
  }, [
    debouncedDescription, debouncedMinimumShares, debouncedEstimatedValue, debouncedRightsSettings,
    hasBenefitInput, isLoading, isLoggedIn,
    descriptionKey, minimumSharesKey, estimatedValueKey, rightsKey,
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
