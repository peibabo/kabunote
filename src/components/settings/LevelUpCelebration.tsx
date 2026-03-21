'use client'

import { useState, useEffect, useRef } from 'react'
import { playSound } from '@/lib/sound'
import ShareButtons from '@/components/common/ShareButtons'

interface LevelUpDetail {
  level: number
  levelName: string
}

export default function LevelUpCelebration() {
  const [celebration, setCelebration] = useState<LevelUpDetail | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()
  const clearTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LevelUpDetail>).detail
      setCelebration(detail)
      setIsVisible(true)
      playSound('levelUp')

      // 5秒後にフェードアウト（シェアボタン操作時間を確保）
      hideTimer.current = setTimeout(() => setIsVisible(false), 5000)
      clearTimer.current = setTimeout(() => setCelebration(null), 5500)
    }

    window.addEventListener('kabunote-level-up', handler)
    return () => {
      window.removeEventListener('kabunote-level-up', handler)
      clearTimeout(hideTimer.current)
      clearTimeout(clearTimer.current)
    }
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

        <div className="mt-2">
          <ShareButtons
            text={`投資家レベルが Lv.${celebration.level}「${celebration.levelName}」に上がりました！`}
          />
        </div>
      </div>
    </div>
  )
}
