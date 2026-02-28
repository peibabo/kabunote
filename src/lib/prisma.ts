import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pkg from 'pg'

const { Pool } = pkg

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Transaction Pooler用のPostgreSQLプール設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // Transaction Pooler は内部SSL処理済み
})
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma