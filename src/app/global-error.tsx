'use client'

import { useEffect, useState } from 'react'

const AUTO_RETRY_SECONDS = 15

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [countdown, setCountdown] = useState(AUTO_RETRY_SECONDS)

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
    <html lang="ja" className="dark">
      <body style={{ background: '#111827', color: '#fff', fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ maxWidth: '28rem', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>🔧</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              ただいまメンテナンス中の気配です
            </h1>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              アプリケーションの読み込みに失敗しました。裏側で修復中です。
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {countdown}秒後に自動で再試行します...
            </p>
            <div style={{ width: '100%', background: '#1f2937', borderRadius: '9999px', height: '4px', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <div
                style={{
                  height: '100%',
                  background: '#3b82f6',
                  borderRadius: '9999px',
                  transition: 'width 1s linear',
                  width: `${((AUTO_RETRY_SECONDS - countdown) / AUTO_RETRY_SECONDS) * 100}%`,
                }}
              />
            </div>
            <button
              onClick={reset}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              今すぐ再試行
            </button>
            <p style={{ color: '#4b5563', fontSize: '0.75rem', marginTop: '1.5rem' }}>
              問題が続く場合は、しばらく時間をおいてからアクセスしてください
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
