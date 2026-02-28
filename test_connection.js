// データベース接続テスト
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function testConnection() {
  try {
    console.log('🔍 データベース接続をテスト中...')

    // 単純なクエリでテスト
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log('✅ 接続成功:', result)

    // usersテーブルが存在するか確認
    try {
      const userCount = await prisma.user.count()
      console.log('✅ usersテーブル存在:', userCount, '件')
    } catch (error) {
      console.log('❌ usersテーブルエラー:', error.message)
    }

    // 実際のスキーマを確認
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('📋 利用可能テーブル:', tables)

  } catch (error) {
    console.error('❌ 接続エラー:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()