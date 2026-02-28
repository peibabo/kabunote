// Supabase接続テスト用のユーティリティ

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const testSupabaseConnection = async () => {
  try {
    console.log('🔌 Supabase接続テスト開始...')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 基本的な接続テスト
    const { data, error } = await supabase
      .from('_supabase_test')
      .select('*')
      .limit(1)

    if (error && error.message.includes('relation "_supabase_test" does not exist')) {
      console.log('✅ Supabase接続成功！（テーブルが存在しないのは正常）')
      console.log('📊 プロジェクト情報:')
      console.log(`   URL: ${supabaseUrl}`)
      console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`)
      return { success: true, message: 'Supabase connection successful' }
    } else if (error) {
      console.error('❌ Supabase接続エラー:', error.message)
      return { success: false, message: error.message }
    } else {
      console.log('✅ Supabase接続成功！')
      return { success: true, message: 'Supabase connection successful' }
    }
  } catch (error) {
    console.error('❌ Supabase接続テスト失敗:', error)
    return { success: false, message: String(error) }
  }
}

export const testSupabaseAuth = async () => {
  try {
    console.log('🔐 Supabase認証テスト開始...')

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 匿名セッションの確認
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ 認証テストエラー:', error.message)
      return { success: false, message: error.message }
    }

    console.log('✅ 認証システム正常動作')
    console.log(`   セッション状態: ${session ? '認証済み' : '未認証（正常）'}`)

    return { success: true, message: 'Auth system working' }
  } catch (error) {
    console.error('❌ 認証テスト失敗:', error)
    return { success: false, message: String(error) }
  }
}