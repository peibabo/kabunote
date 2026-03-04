import { prisma } from '@/lib/prisma'

/**
 * stock-SYMBOL 形式のIDをDB UUIDに変換する共通関数
 *
 * @param stockIdParam - `stock-7203` 形式またはDB UUID
 * @param userId - 認証ユーザーID
 * @param createIfNotFound - true の場合、銘柄未登録時に lazy 新規作成する（memo route 用）
 * @returns DB UUID（見つからない場合は null）
 */
export async function resolveStockId(
  stockIdParam: string,
  userId: string,
  createIfNotFound = false
): Promise<string | null> {
  if (stockIdParam.startsWith('stock-')) {
    const symbol = stockIdParam.replace('stock-', '')
    const existing = await prisma.stock.findFirst({ where: { userId, symbol } })
    if (existing) return existing.id

    if (!createIfNotFound) return null

    // lazy 登録（銘柄が未登録の場合は末尾順で新規作成）
    try {
      const maxOrder = await prisma.stock.aggregate({
        where: { userId },
        _max: { order: true },
      })
      const nextOrder = (maxOrder._max.order ?? -1) + 1
      const stock = await prisma.stock.create({
        data: { userId, symbol, name: null, sector: null, market: null, order: nextOrder },
      })
      return stock.id
    } catch {
      // unique制約違反（競合）の場合は再取得
      const fallback = await prisma.stock.findFirst({ where: { userId, symbol } })
      return fallback?.id ?? null
    }
  }

  const stock = await prisma.stock.findFirst({ where: { id: stockIdParam, userId } })
  return stock?.id ?? null
}
