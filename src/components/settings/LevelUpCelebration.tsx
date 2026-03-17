'use client'

import { useState, useEffect } from 'react'
import { playSound } from '@/lib/sound'

interface LevelUpDetail {
  level: number
  levelName: string
}

export default function LevelUpCelebration() {
  const [celebration, setCelebration] = useState<LevelUpDetail | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LevelUpDetail>).detail
      setCelebration(detail)
      setIsVisible(true)
      playSound('levelUp')

      // 3秒後にフェードアウト
      setTimeout(() => setIsVisible(false), 3000)
      // フェードアウト後にクリア
      setTimeout(() => setCelebration(null), 3500)
    }

    window.addEventListener('kabunote-level-up', handler)
    return () => window.removeEventListener('kabunote-level-up', handler)
  }, [])

  if (!celebration) return null

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* コンテンツ */}
      <div
        className={`
          relative flex flex-col items-center gap-4 px-8 py-6 rounded-2xl
          transition-all duration-500
          ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}
        `}
        style={{
          background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.9), rgba(180, 83, 9, 0.85), rgba(120, 53, 15, 0.9))',
          border: '2px solid rgba(251, 191, 36, 0.6)',
          boxShadow: '0 0 40px rgba(251, 191, 36, 0.3), 0 0 80px rgba(251, 191, 36, 0.15)',
        }}
      >
        {/* 星アニメーション */}
        <div className="text-4xl animate-bounce">
          &#x2B50;
        </div>

        <div className="text-center">
          <p className="text-amber-300 text-sm font-medium tracking-wider mb-1">
            LEVEL UP!
          </p>
          <p
            className="text-3xl font-bold mb-1"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Lv.{celebration.level}
          </p>
          <p className="text-amber-200 text-base font-medium">
            {celebration.levelName}
          </p>
        </div>
      </div>
    </div>
  )
}
