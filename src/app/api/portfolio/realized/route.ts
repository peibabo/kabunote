import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import type { ConsumedLot } from '@/types/realizedTrade'

// consumed_lots(JSON) を ConsumedLot[] に正規化（後方互換: 欠損時は空配列）
function parseConsumedLots(value: unknown): ConsumedLot[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((v): v is { shares: number; purchaseDate?: string } => typeof v === 'object' && v !== null && typeof (v as { shares?: unknown }).shares === 'number')
    .map(v => ({ shares: v.shares, purchaseDate: typeof v.purchaseDate === 'string' ? v.purchaseDate : '' }))
}

// GET: ユーザーの全確定損益履歴を取得。?year=2026 で年フィルタ（sellDateの先頭4桁）
export const GET = withAuth(async ({ user, request }) => {
  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')

  const where: { stock: { userId: string }; sellDate?: { startsWith: string } } = {
    stock: { userId: user.id },
  }
  if (yearParam && /^\d{4}$/.test(yearParam)) {
    where.sellDate = { startsWith: `${yearParam}-` }
  }

  const trades = await prisma.realizedTrade.findMany({
    where,
    orderBy: [{ sellDate: 'desc' }, { createdAt: 'desc' }],
    include: { stock: { select: { symbol: true } } },
  })

  return NextResponse.json({
    success: true,
    data: trades.map(t => ({
      id: t.id,
      stockId: t.stockId,
      symbol: t.stock.symbol,
      soldShares: t.soldShares,
      sellPrice: Number(t.sellPrice),
      costBasis: Number(t.costBasis),
      sellDate: t.sellDate,
      realizedPL: Number(t.realizedPL),
      taxRate: Number(t.taxRate),
      consumedLots: parseConsumedLots(t.consumedLots),
      memo: t.memo ?? '',
      createdAt: t.createdAt.toISOString(),
    })),
  })
}, '確定損益一覧の取得')
