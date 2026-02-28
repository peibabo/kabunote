import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'

const { Pool } = pkg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Supabase Transaction Pooler用のPostgreSQLプール設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase用SSL設定
  connectTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10 // 接続プールサイズ
})
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'], // ログレベル調整
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma