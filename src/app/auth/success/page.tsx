'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'

export default function AuthSuccess() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URLからセッション情報を取得・処理
        const { error: authError } = await supabase.auth.getSession()

        if (authError) {
          console.error('セッション取得エラー:', authError.message)
        }

        // 認証状態が変更されるまで少し待つ
        let attempts = 0
        const maxAttempts = 10

        const checkSession = async () => {
          const { data: sessionData } = await supabase.auth.getSession()

          if (sessionData.session) {
            // 1秒後にホームページへリダイレクト
            setTimeout(() => {
              router.push('/')
            }, 1000)
            return true
          }

          attempts++
          if (attempts < maxAttempts) {
            setTimeout(checkSession, 500) // 500ms後に再チェック
          } else {
            router.push('/')
          }

          return false
        }

        await checkSession()
      } catch (error) {
        console.error('認証処理エラー:', error)
        setError('認証処理中にエラーが発生しました。')
      } finally {
        setLoading(false)
      }
    }

    handleAuthCallback()
  }, [supabase, router])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">認証エラー</h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            ホームに戻る
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">認証処理中...</h1>
          <p className="text-gray-300">
            しばらくお待ちください
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">認証成功！</h1>
        <p className="text-gray-300 mb-6">
          まもなくカブノオトにリダイレクトします...
        </p>
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  )
}