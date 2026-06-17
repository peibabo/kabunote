import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { parseConsumedLots } from '@/lib/realizedTradeCalc'

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
