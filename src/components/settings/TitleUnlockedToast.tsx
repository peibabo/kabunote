'use client'

import { useState, useEffect } from 'react'
import { playSound } from '@/lib/sound'
import type { TitleStatus } from '@/types/titles'

const RARITY_COLORS = {
  common: 'from-gray-700 to-gray-600 border-gray-500',
  rare: 'from-blue-900/80 to-blue-800/80 border-blue-500/60',
  epic: 'from-purple-900/80 to-purple-800/80 border-purple-500/60',
  legendary: 'from-amber-900/80 to-amber-800/80 border-amber-400/60',
}

export default function TitleUnlockedToast() {
  const [queue, setQueue] = useState<TitleStatus[]>([])
  const [current, setCurrent] = useState<TitleStatus | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // イベントリスニング
  useEffect(() => {
    const handler = (e: Event) => {
      const title = (e as CustomEvent<TitleStatus>).detail
      setQueue(prev => [...prev, title])
    }
    window.addEventListener('kabunote-title-unlocked', handler)
    return () => window.removeEventListener('kabunote-title-unlocked', handler)
  }, [])

  // キューから表示
  useEffect(() => {
    if (current || queue.length === 0) return
    const [next, ...rest] = queue
    setCurrent(next)
    setQueue(rest)
    setIsVisible(true)
    playSound('accordionOpen')

    const hideTimer = setTimeout(() => setIsVisible(false), 3000)
    const clearTimer = setTimeout(() => setCurrent(null), 3500)
    return () => {
      clearTimeout(hideTimer)
      clearTimeout(clearTimer)
    }
  }, [queue, current])

  if (!current) return null

  const colorClass = RARITY_COLORS[current.rarity]

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] pointer-events-none
        transition-all duration-500
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      <div
        className={`
          flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md
          bg-gradient-to-r ${colorClass}
        `}
        style={{
          boxShadow: current.rarity === 'legendary'
            ? '0 0 20px rgba(251, 191, 36, 0.3)'
            : '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span className="text-2xl">{current.icon}</span>
        <div>
          <p className="text-gray-400 text-[10px] tracking-wider">TITLE UNLOCKED</p>
          <p className="text-white text-sm font-medium">{current.name}</p>
        </div>
      </div>
    </div>
  )
}
