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

async function debugSchema() {
  try {
    console.log('🔍 データベーススキーマ詳細調査開始...')

    // 1. stocksテーブル構造確認
    console.log('\n📊 stocks テーブル構造:')
    const stocksSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'stocks'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
    console.table(stocksSchema)

    // 2. Stock（大文字）テーブル構造確認
    console.log('\n📊 Stock（大文字）テーブル構造:')
    try {
      const StockSchema = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Stock'
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
      console.table(StockSchema)
    } catch (e) {
      console.log('Stock（大文字）テーブルは存在しません')
    }

    // 3. app_usersテーブル構造確認
    console.log('\n👤 app_users テーブル構造:')
    const usersSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'app_users'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
    console.table(usersSchema)

    // 4. stock_prices テーブル構造確認
    console.log('\n💰 stock_prices テーブル構造:')
    const pricesSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'stock_prices'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `
    console.table(pricesSchema)

    // 5. 実際のデータサンプル確認
    console.log('\n📋 stocks テーブル実際のデータ:')
    const stockData = await prisma.$queryRaw`
      SELECT * FROM stocks LIMIT 3;
    `
    console.table(stockData)

    // 6. 外部キー制約確認
    console.log('\n🔗 外部キー制約:')
    const constraints = await prisma.$queryRaw`
      SELECT
        tc.table_name,
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('stocks', 'stock_prices', 'stock_memos')
      ORDER BY tc.table_name;
    `
    console.table(constraints)

  } catch (error) {
    console.error('❌ スキーマ調査エラー:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSchema()