'use client'

import { useState } from 'react'
import { testSupabaseConnection, testSupabaseAuth } from '@/lib/supabase-test'

export default function SupabaseTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const runTests = async () => {
    setIsLoading(true)
    setTestResults(['🔌 Supabaseテスト開始...'])

    try {
      // 接続テスト
      const connectionResult = await testSupabaseConnection()
      setTestResults(prev => [...prev,
        connectionResult.success
          ? '✅ 接続テスト: 成功'
          : `❌ 接続テスト: ${connectionResult.message}`
      ])

      // 認証テスト
      const authResult = await testSupabaseAuth()
      setTestResults(prev => [...prev,
        authResult.success
          ? '✅ 認証テスト: 成功'
          : `❌ 認証テスト: ${authResult.message}`
      ])

      // 環境変数確認
      setTestResults(prev => [...prev,
        '📊 環境変数確認:',
        `   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
        `   ANON KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`,
        '🎉 全テスト完了！'
      ])

    } catch (error) {
      setTestResults(prev => [...prev, `❌ テスト実行エラー: ${error}`])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔌 Supabase接続テスト</h1>

        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg font-medium ${
              isLoading
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '📡 テスト実行中...' : '🚀 テスト開始'}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 テスト結果</h2>
          <div className="space-y-2 font-mono text-sm">
            {testResults.length === 0 ? (
              <p className="text-gray-400">テスト開始ボタンを押してください</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-green-400">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">ℹ️ このテストについて</h3>
          <ul className="space-y-1 text-sm text-blue-200">
            <li>• Supabaseプロジェクトへの基本接続を確認</li>
            <li>• 認証システムの動作を確認</li>
            <li>• 環境変数の設定状況を表示</li>
          </ul>
        </div>
      </div>
    </div>
  )
}