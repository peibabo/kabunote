import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const { Pool } = pkg

console.log('🔍 データベース接続テスト開始...')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '設定あり' : '❌ 未設定')

// 1. 環境変数チェック
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URLが設定されていません')
  process.exit(1)
}

// 2. 直接PostgreSQL接続テスト
async function testDirectConnection() {
  try {
    console.log('\n📡 直接PostgreSQL接続テスト...')

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Supabase用SSL設定
      connectTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 1
    })

    console.log('🔄 接続プール作成完了')

    // 接続テスト
    const client = await pool.connect()
    console.log('✅ PostgreSQL直接接続成功')

    // 簡単なクエリテスト
    const result = await client.query('SELECT NOW() as current_time')
    console.log('⏰ サーバー時刻:', result.rows[0].current_time)

    client.release()
    await pool.end()

    return true
  } catch (error) {
    console.error('❌ 直接接続エラー:', error.message)
    if (error.code) console.error('エラーコード:', error.code)
    return false
  }
}

// 3. Prisma接続テスト
async function testPrismaConnection() {
  try {
    console.log('\n🔧 Prisma接続テスト...')

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })

    const adapter = new PrismaPg(pool)
    const prisma = new PrismaClient({ adapter })

    // 接続テスト
    await prisma.$connect()
    console.log('✅ Prisma接続成功')

    // スキーマテスト
    const userCount = await prisma.user.count()
    console.log('👥 app_usersテーブル件数:', userCount)

    const stockCount = await prisma.stock.count()
    console.log('📊 stocksテーブル件数:', stockCount)

    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('❌ Prisma接続エラー:', error.message)
    if (error.code) console.error('エラーコード:', error.code)
    return false
  }
}

// 4. 総合テスト実行
async function runConnectionTests() {
  console.log('=' .repeat(50))

  const directOk = await testDirectConnection()
  const prismaOk = await testPrismaConnection()

  console.log('\n📋 接続テスト結果:')
  console.log('直接接続:', directOk ? '✅ 成功' : '❌ 失敗')
  console.log('Prisma接続:', prismaOk ? '✅ 成功' : '❌ 失敗')

  if (directOk && prismaOk) {
    console.log('\n🎉 全接続テスト成功！データベースは正常です')
  } else {
    console.log('\n🚨 接続に問題があります')

    // 対処法提示
    console.log('\n🛠️  推奨対処法:')
    console.log('1. Supabaseダッシュボードでプロジェクト状態確認')
    console.log('2. DATABASE_URL設定確認')
    console.log('3. ネットワーク接続確認')
    console.log('4. Supabaseプロジェクトの一時停止解除')
  }

  process.exit(directOk && prismaOk ? 0 : 1)
}

runConnectionTests()