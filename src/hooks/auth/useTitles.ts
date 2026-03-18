'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { TitlesResponse, TitleStatus } from '@/types/titles'

const STORAGE_KEY = 'kabunote-unlocked-title-ids'

export function useTitles() {
  const [titles, setTitles] = useState<TitlesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const prevUnlockedRef = useRef<Set<string> | null>(null)

  const fetchTitles = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification/titles')
      if (!res.ok) return
      const json = await res.json()
      const data = json.data as TitlesResponse
      setTitles(data)

      // 新規獲得検知
      const currentUnlocked = new Set(
        data.titles.filter((t: TitleStatus) => t.unlocked).map((t: TitleStatus) => t.id)
      )

      // 初回はlocalStorageから前回値を復元
      if (!prevUnlockedRef.current) {
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          prevUnlockedRef.current = stored ? new Set(JSON.parse(stored) as string[]) : new Set()
        } catch {
          prevUnlockedRef.current = new Set()
        }
      }

      // 差分検知
      const prev = prevUnlockedRef.current
      const newlyUnlocked = data.titles.filter(
        (t: TitleStatus) => t.unlocked && !prev.has(t.id)
      )

      if (newlyUnlocked.length > 0) {
        for (const title of newlyUnlocked) {
          window.dispatchEvent(
            new CustomEvent('kabunote-title-unlocked', { detail: title })
          )
        }
      }

      // 更新
      prevUnlockedRef.current = currentUnlocked
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...currentUnlocked]))
    } catch {
      // 取得失敗は無視
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 初回ロード
  useEffect(() => {
    fetchTitles()
  }, [fetchTitles])

  // XPイベント連動で再フェッチ
  useEffect(() => {
    const handler = () => { fetchTitles() }
    window.addEventListener('kabunote-xp-gained', handler)
    return () => window.removeEventListener('kabunote-xp-gained', handler)
  }, [fetchTitles])

  return { titles, isLoading }
}
