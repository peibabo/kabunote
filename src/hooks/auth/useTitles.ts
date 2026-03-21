'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TitlesResponse, TitleStatus } from '@/types/titles'

export function useTitles() {
  const [titles, setTitles] = useState<TitlesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTitles = useCallback(async () => {
    try {
      const res = await fetch('/api/gamification/titles')
      if (!res.ok) return
      const json = await res.json()
      const data = json.data as TitlesResponse
      setTitles(data)

      // DB管理の通知済みIDで差分検知
      const notifiedSet = new Set(data.notifiedTitleIds)
      const newlyUnlocked = data.titles.filter(
        (t: TitleStatus) => t.unlocked && !notifiedSet.has(t.id)
      )

      if (newlyUnlocked.length > 0) {
        // トースト表示
        for (const title of newlyUnlocked) {
          window.dispatchEvent(
            new CustomEvent('kabunote-title-unlocked', { detail: title })
          )
        }

        // 通知済みIDをDB更新（全獲得済みIDを送信）
        const allUnlockedIds = data.titles
          .filter((t: TitleStatus) => t.unlocked)
          .map((t: TitleStatus) => t.id)

        fetch('/api/gamification/titles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titleIds: allUnlockedIds }),
        }).catch(() => { /* 更新失敗は無視（次回再通知されるだけ） */ })
      }
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
