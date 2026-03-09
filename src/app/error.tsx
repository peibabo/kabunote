'use client'

import { useEffect, useState } from 'react'

const friendlyMessages = [
  { emoji: '☕', title: 'サーバーが一時休場中です', sub: 'ちょっとコーヒーブレイク中のようです。すぐ戻ります。' },
  { emoji: '📉', title: '一時的なストップ安です', sub: '相場と同じで、すぐ持ち直します。ご安心ください。' },
  { emoji: '🔧', title: 'ただいまメンテナンス中の気配', sub: '裏側で修復作業をしています。もう少しだけお待ちください。' },
  { emoji: '🌙', title: 'サーバーが寄り付き前です', sub: 'まもなく取引開始です。少々お待ちください。' },
  { emoji: '🏖️', title: 'サーバーがお休みをいただいています', sub: 'リフレッシュ中です。すぐに元気に戻ります。' },
]

const BASE_RETRY_SECONDS = 15
const MAX_RETRY_SECONDS = 60
const STORAGE_KEY = 'error-retry-attempt'

function getRetrySeconds(attempt: number): number {
  return Math.min(BASE_RETRY_SECONDS * Math.pow(2, attempt), MAX_RETRY_SECONDS)
}

function getAndIncrementAttempt(): number {
  try {
    const current = parseInt(sessionStorage.getItem(STORAGE_KEY) || '0', 10)
    sessionStorage.setItem(STORAGE_KEY, String(current + 1))
    return current
  } catch {
    return 0
  }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [msgIndex] = useState(() => Math.floor(Math.random() * friendlyMessages.length))
  const [attempt] = useState(() => getAndIncrementAttempt())
  const retrySeconds = getRetrySeconds(attempt)
  const [countdown, setCountdown] = useState(retrySeconds)

  const msg = friendlyMessages[msgIndex]

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          reset()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [reset])

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-7xl animate-[gentleBounce_2s_ease-in-out_infinite]">
          {msg.emoji}
        </div>
        <h1 className="text-2xl font-bold text-white">{msg.title}</h1>
        <p className="text-gray-400 leading-relaxed">{msg.sub}</p>

        <div className="text-sm text-gray-500">
          {attempt > 0
            ? `${attempt + 1}回目の再試行（${countdown}秒後）...`
            : `${countdown}秒後に自動で再試行します...`}
        </div>

        <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${((retrySeconds - countdown) / retrySeconds) * 100}%` }}
          />
        </div>

        {process.env.NODE_ENV === 'development' && (
          <pre className="text-left text-xs text-red-400/70 bg-gray-800/50 rounded-lg p-4 overflow-auto max-h-40">
            {error.message}
          </pre>
        )}

        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            今すぐ再試行
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            トップに戻る
          </a>
        </div>

        <p className="text-xs text-gray-600">
          問題が続く場合は、しばらく時間をおいてからアクセスしてください
        </p>
      </div>
    </div>
  )
}
