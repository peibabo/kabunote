'use client'

import { useState, useEffect } from 'react'
import { shouldMigrate, getMigrationStatus } from '@/lib/migration'
import { exportKabunoteData } from '@/utils/dataManager'
import MigrationModal from './MigrationModal'

interface MigrationBannerProps {
  isLoggedIn: boolean
}

export default function MigrationBanner({ isLoggedIn }: MigrationBannerProps) {
  const [showBanner, setShowBanner] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [stockCount, setStockCount] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      setShowBanner(false)
      return
    }

    // 移行の必要性をチェック
    const needsMigration = shouldMigrate()
    const migrationStatus = getMigrationStatus()
    const dismissed = localStorage.getItem('migration-banner-dismissed')

    if (needsMigration && migrationStatus.status === 'pending' && !dismissed) {
      try {
        const data = exportKabunoteData()
        setStockCount(data.stocks.length)
        setShowBanner(data.stocks.length > 0)
      } catch (error) {
        console.error('Failed to check local data:', error)
        setShowBanner(false)
      }
    } else {
      setShowBanner(false)
    }
  }, [isLoggedIn])

  const handleDismiss = () => {
    setIsDismissed(true)
    setShowBanner(false)
    localStorage.setItem('migration-banner-dismissed', 'true')
  }

  const handleMigrationSuccess = () => {
    setShowModal(false)
    setShowBanner(false)
    // ページをリロードして新しいデータベースからデータを読み込み
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  if (!showBanner) return null

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-blue-500">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    🚀 データベース移行のお知らせ
                  </h3>
                  <p className="text-blue-100 text-xs">
                    {stockCount}銘柄のデータをクラウドに移行して、より安全に管理しませんか？
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-4 text-blue-100 text-xs">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  データ同期
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  安全性向上
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  バックアップ完備
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowModal(true)}
                className="bg-white hover:bg-gray-100 text-blue-600 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
              >
                今すぐ移行
              </button>
              <button
                onClick={handleDismiss}
                className="text-blue-200 hover:text-white p-2 rounded transition-colors"
                title="このお知らせを非表示"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MigrationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleMigrationSuccess}
      />
    </>
  )
}