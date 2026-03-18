'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GamificationState } from '@/types/gamification'

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
  useEffect(() => {
    const handler = () => { fetchState() }
    window.addEventListener('kabunote-xp-gained', handler)
    window.addEventListener('kabunote-level-up', handler)
    return () => {
      window.removeEventListener('kabunote-xp-gained', handler)
      window.removeEventListener('kabunote-level-up', handler)
    }
  }, [fetchState])

  return { gamification, isLoading }
}
