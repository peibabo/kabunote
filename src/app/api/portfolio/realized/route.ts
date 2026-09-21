import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { serializeRealizedTrade } from '@/lib/realizedTradeSerialize'

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
    data: trades.map(t => serializeRealizedTrade(t, t.stock.symbol)),
  })
}, '確定損益一覧の取得')
