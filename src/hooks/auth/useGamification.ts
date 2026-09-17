'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GamificationState } from '@/types/gamification'
import { useAppEvent } from '@/hooks/util/useAppEvent'
import { APP_EVENTS } from '@/lib/appEvents'

export function useGamification() {
  const [gamification, setGamification] = useState<GamificationState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification')
      if (res.ok) {
        const json = await res.json()
        setGamification(json.data)
      }
    } catch {
      // 取得失敗は無視
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初回ロード
  useEffect(() => {
    fetchState()
  }, [fetchState])

  // XP獲得・レベルアップイベントをリスニングして再取得
  useAppEvent(APP_EVENTS.XP_GAINED, () => { fetchState() })
  useAppEvent(APP_EVENTS.LEVEL_UP, () => { fetchState() })

  return { gamification, isLoading }
}
