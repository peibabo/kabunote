'use client'

import { useEffect } from 'react'
import type { TitlesResponse, TitleStatus } from '@/types/titles'
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'
import { apiFetch } from '@/lib/apiClient'
import { useSharedFetch, revalidateShared } from '@/hooks/util/useSharedFetch'

/**
 * 共有キャッシュのキー。
 * このフックは LevelBadge・SlideOutMenu・称号一覧から同時に呼ばれ、以前はインスタンスごとに
 * 取得していた（XP獲得のたびに同じAPIが複数回飛び、新規称号の通知も重複しうる）。
 * 1回だけ取得して全インスタンスで共有する。
 */
const CACHE_KEY = 'gamification-titles'

/**
 * 称号を取得し、未通知の新規獲得称号があればトーストを出して通知済みを更新する。
 * 通知はインスタンスではなく取得1回につき1回だけ行うため、fetcher の中で処理する。
 */
async function fetchTitles(): Promise<TitlesResponse> {
  const data = await apiFetch<TitlesResponse>('/api/gamification/titles')

  // DB管理の通知済みIDで差分検知
  const notifiedSet = new Set(data.notifiedTitleIds)
  const newlyUnlocked = data.titles.filter(
    (t: TitleStatus) => t.unlocked && !notifiedSet.has(t.id)
  )
  if (newlyUnlocked.length === 0) return data

  // トースト表示
  for (const title of newlyUnlocked) {
    emitAppEvent(APP_EVENTS.TITLE_UNLOCKED, title)
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

  return { ...data, notifiedTitleIds: allUnlockedIds }
}

/**
 * XP獲得時の再取得。リスナーはマウント数に関係なく1つだけ登録する
 * （インスタンスごとに登録すると、1回のXP獲得でマウント数ぶん取得が走る）。
 */
let mountedCount = 0
function handleXpGained(): void {
  void revalidateShared(CACHE_KEY)
}

export function useTitles() {
  const { data, isLoading } = useSharedFetch<TitlesResponse>(CACHE_KEY, fetchTitles)

  useEffect(() => {
    if (mountedCount++ === 0) window.addEventListener(APP_EVENTS.XP_GAINED, handleXpGained)
    return () => {
      if (--mountedCount === 0) window.removeEventListener(APP_EVENTS.XP_GAINED, handleXpGained)
    }
  }, [])

  return { titles: data ?? null, isLoading }
}
