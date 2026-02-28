'use client'

import { useState, useEffect } from 'react'
import { migrateLocalStorageToSupabase, markMigrationCompleted, shouldMigrate, getMigrationStatus } from '@/lib/migration'
import { exportKabunoteData } from '@/utils/dataManager'
import type { MigrationResult, MigrationProgress } from '@/lib/migration'

interface MigrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function MigrationModal({ isOpen, onClose, onSuccess }: MigrationModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState<MigrationProgress | null>(null)
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [localDataPreview, setLocalDataPreview] = useState<{
    stockCount: number
    dataSize: string
  } | null>(null)

  useEffect(() => {
    if (isOpen) {
      // ローカルデータのプレビューを生成
      try {
        const data = exportKabunoteData()
        setLocalDataPreview({
          stockCount: data.stocks.length,
          dataSize: `${JSON.stringify(data).length} 文字`
        })
      } catch (error) {
        console.error('Failed to preview local data:', error)
      }
    }
  }, [isOpen])

  const handleMigration = async () => {
    setIsLoading(true)
    setProgress(null)
    setResult(null)

    try {
      const migrationResult = await migrateLocalStorageToSupabase((progress) => {
        setProgress(progress)
      })

      setResult(migrationResult)

      if (migrationResult.success) {
        markMigrationCompleted()
        onSuccess?.()
      }
    } catch (error) {
      setResult({
        success: false,
        message: `移行中にエラーが発生しました: ${error}`
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">🔄 データベース移行</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded"
          >
            ✕
          </button>
        </div>

        {!result ? (
          <>
            {/* 移行前の説明 */}
            <div className="mb-6">
              <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-blue-300 mb-2">📋 移行について</h3>
                <p className="text-blue-200 text-sm mb-3">
                  現在ブラウザに保存されているデータを、安全なクラウドデータベースに移行します。
                </p>
                <ul className="text-blue-200 text-sm space-y-1 list-disc list-inside">
                  <li>既存のlocalStorageデータはそのまま残ります（バックアップとして）</li>
                  <li>移行後はクラウドで自動的にデータが同期されます</li>
                  <li>複数デバイスでデータを共有できるようになります</li>
                  <li>データ損失のリスクが大幅に軽減されます</li>
                </ul>
              </div>

              {localDataPreview && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">📊 移行対象データ</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-gray-300">登録銘柄数</div>
                      <div className="text-2xl font-bold text-green-400">
                        {localDataPreview.stockCount}銘柄
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-gray-300">データ量</div>
                      <div className="text-lg font-bold text-blue-400">
                        {localDataPreview.dataSize}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 進行状況表示 */}
            {progress && (
              <div className="mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">{progress.stage}</span>
                    <span className="text-gray-400 text-sm">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-300 text-sm">{progress.message}</p>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleMigration}
                disabled={isLoading || !localDataPreview || localDataPreview.stockCount === 0}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    移行中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    移行開始
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* 結果表示 */
          <div className="text-center">
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
              result.success ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {result.success ? (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <h3 className={`text-2xl font-bold mb-3 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? '移行完了！' : '移行失敗'}
            </h3>

            <p className="text-gray-300 mb-6">{result.message}</p>

            {result.success && result.details && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">📊 移行結果詳細</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-700 rounded p-2">
                    <div className="text-gray-300">銘柄</div>
                    <div className="text-lg font-bold text-green-400">{result.details.stocks}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-2">
                    <div className="text-gray-300">メモ</div>
                    <div className="text-lg font-bold text-blue-400">{result.details.memos}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-2">
                    <div className="text-gray-300">タグ</div>
                    <div className="text-lg font-bold text-purple-400">{result.details.tags}</div>
                  </div>
                  <div className="bg-gray-700 rounded p-2">
                    <div className="text-gray-300">ポジション</div>
                    <div className="text-lg font-bold text-yellow-400">{result.details.positions}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              完了
            </button>
          </div>
        )}
      </div>
    </div>
  )
}