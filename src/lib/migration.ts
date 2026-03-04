// LocalStorageからSupabaseへのデータ移行ユーティリティ

import { createClient } from '@/lib/supabase-client'
import { KabunoteData, exportKabunoteData } from '@/utils/dataManager'
import { prisma } from '@/lib/prisma'

export interface MigrationResult {
  success: boolean
  message: string
  details?: {
    users: number
    stocks: number
    memos: number
    tags: number
    positions: number
    events: number
    dividends: number
    benefits: number
    nextActionPlans: number
    favoriteGroups: number
    snoozedAlerts: number
    tabStates: number
  }
  errors?: string[]
}

export interface MigrationProgress {
  stage: string
  current: number
  total: number
  message: string
}

/**
 * LocalStorageデータをSupabaseに移行する
 */
export async function migrateLocalStorageToSupabase(
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const supabase = createClient()
  const errors: string[] = []
  let totalMigrated = 0

  try {
    // 認証状態確認
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return {
        success: false,
        message: 'ログインが必要です'
      }
    }

    const userId = session.user.id

    onProgress?.({
      stage: 'データエクスポート',
      current: 1,
      total: 10,
      message: 'LocalStorageからデータを読み込み中...'
    })

    // LocalStorageからデータを取得
    const localData = exportKabunoteData()

    if (localData.stocks.length === 0) {
      return {
        success: false,
        message: '移行するデータがありません'
      }
    }

    onProgress?.({
      stage: 'ユーザー確認',
      current: 2,
      total: 10,
      message: 'ユーザー情報を確認中...'
    })

    // データベースAPIを通じて移行を実行
    const migrationResponse = await fetch('/api/migration/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        localData,
      }),
    })

    if (!migrationResponse.ok) {
      const errorData = await migrationResponse.json()
      throw new Error(errorData.error || errorData.message || `移行APIエラー (${migrationResponse.status}: ${migrationResponse.statusText})`)
    }

    const result = await migrationResponse.json()

    onProgress?.({
      stage: '完了',
      current: 10,
      total: 10,
      message: 'データ移行が完了しました！'
    })

    return {
      success: true,
      message: `${localData.stocks.length}銘柄のデータを正常に移行しました`,
      details: result.details
    }

  } catch (error) {
    console.error('Migration error:', error)
    return {
      success: false,
      message: `移行中にエラーが発生しました: ${error}`,
      errors
    }
  }
}

/**
 * 移行が必要かどうかを判定
 */
export function shouldMigrate(): boolean {
  if (typeof window === 'undefined') return false

  // LocalStorageにデータが存在するかチェック
  const hasStocks = localStorage.getItem('kabunote-stocks')
  const migrationStatus = localStorage.getItem('kabunote-migration-status')

  return !!hasStocks && migrationStatus !== 'completed'
}

/**
 * 移行完了をマーク
 */
export function markMigrationCompleted(): void {
  if (typeof window === 'undefined') return

  localStorage.setItem('kabunote-migration-status', 'completed')
  localStorage.setItem('kabunote-migration-date', new Date().toISOString())
}

/**
 * 移行状況を取得
 */
export function getMigrationStatus(): {
  status: 'not_needed' | 'pending' | 'completed'
  completedDate?: string
} {
  if (typeof window === 'undefined') {
    return { status: 'not_needed' }
  }

  const hasLocalData = localStorage.getItem('kabunote-stocks')
  const migrationStatus = localStorage.getItem('kabunote-migration-status')
  const completedDate = localStorage.getItem('kabunote-migration-date')

  if (!hasLocalData) {
    return { status: 'not_needed' }
  }

  if (migrationStatus === 'completed') {
    return {
      status: 'completed',
      completedDate: completedDate || undefined
    }
  }

  return { status: 'pending' }
}