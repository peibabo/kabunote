// Next.js API内でのPrisma接続テスト
import { createClient } from './src/lib/supabase-server.js'
import { prisma } from './src/lib/prisma.js'

async function testApiConnection() {
  try {
    console.log('🔍 Next.js API環境でのデータベース接続テスト...')

    // 1. 環境変数チェック
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ 設定済み' : '❌ 未設定')

    // 2. Prisma接続テスト
    console.log('\n🔧 Next.js内Prisma接続テスト...')

    const userCount = await prisma.user.count()
    console.log('👥 app_usersテーブル件数:', userCount)

    const stockCount = await prisma.stock.count()
    console.log('📊 stocksテーブル件数:', stockCount)

    // 3. 実際の株メモ取得テスト
    console.log('\n📝 株メモ取得テスト...')

    let memo = await prisma.stockMemo.findUnique({
      where: { stockId: 'stock-7203' }
    })

    if (!memo) {
      console.log('📝 株メモが存在しないため新規作成...')
      memo = await prisma.stockMemo.create({
        data: {
          stockId: 'stock-7203',
          content: 'テスト用メモ - ' + new Date().toISOString()
        }
      })
    }

    console.log('📝 株メモ内容:', memo.content.substring(0, 50) + '...')
    console.log('⏰ 最終更新:', memo.updatedAt)

    console.log('\n🎉 Next.js API環境での接続テスト成功!')

  } catch (error) {
    console.error('❌ Next.js API環境での接続エラー:', error.message)
    console.error('📊 エラー詳細:', error)

    if (error.code) {
      console.error('🔍 エラーコード:', error.code)
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testApiConnection()