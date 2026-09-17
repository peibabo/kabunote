'use client'

import { useState, useCallback } from 'react'
import { playSound } from '@/lib/sound'
import ShareButtons from '@/components/common/ShareButtons'
import { useAppEvent } from '@/hooks/util/useAppEvent'
import { APP_EVENTS } from '@/lib/appEvents'

interface LevelUpDetail {
  level: number
  levelName: string
}

export default function LevelUpCelebration() {
  const [celebration, setCelebration] = useState<LevelUpDetail | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => setCelebration(null), 500)
  }, [])

  useAppEvent(APP_EVENTS.LEVEL_UP, (detail) => {
    setCelebration(detail)
    setIsVisible(true)
    playSound('levelUp')
  })

  if (!celebration) return null

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        transition-opacity duration-500
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      {/* 背景オーバーレイ（クリックで閉じる） */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

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
        {/* 閉じるボタン */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-amber-300 hover:text-amber-100 transition-colors p-1"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

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
