import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withStock } from '@/lib/apiHandler'
import { resolveStockId } from '@/lib/resolveStockId'
import { isValidRequiredShares, isValidRequiredPrice } from '@/lib/validation'
import { calculatePositionSummary } from '@/lib/positionCalc'
import { getTodayJST } from '@/lib/dateJst'
import type { Position } from '@/types/positions'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_MEMO_LENGTH = 500

// DBレコード → APIレスポンス形式
function serializeTrade(t: {
  id: string; stockId: string; soldShares: number; sellPrice: unknown; costBasis: unknown;
  sellDate: string; realizedPL: unknown; taxRate: unknown; memo: string | null; createdAt: Date
}, symbol: string) {
  return {
    id: t.id,
    stockId: t.stockId,
    symbol,
    soldShares: t.soldShares,
    sellPrice: Number(t.sellPrice),
    costBasis: Number(t.costBasis),
    sellDate: t.sellDate,
    realizedPL: Number(t.realizedPL),
    taxRate: Number(t.taxRate),
    memo: t.memo ?? '',
    createdAt: t.createdAt.toISOString(),
  }
}

// POST: 保有ポジションを売却（確定損益を記録し、買いロットから消し込む）
export const POST = withStock(async ({ stockId, request }) => {
  const { soldShares, sellPrice, sellDate, memo } = await request.json()

  if (!isValidRequiredShares(soldShares)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'soldSharesは1以上の有効な数値である必要があります' },
      { status: 400 }
    )
  }
  if (!isValidRequiredPrice(sellPrice)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'sellPriceは0より大きい有効な数値である必要があります' },
      { status: 400 }
    )
  }
  if (typeof memo === 'string' && memo.length > MAX_MEMO_LENGTH) {
    return NextResponse.json(
      { error: 'Bad Request', message: `memoは${MAX_MEMO_LENGTH}文字以内である必要があります` },
      { status: 400 }
    )
  }
  const resolvedSellDate = (typeof sellDate === 'string' && DATE_PATTERN.test(sellDate)) ? sellDate : getTodayJST()

  // 現在の買いロットを取得（古い順）
  const lots = await prisma.stockPosition.findMany({
    where: { stockId },
    orderBy: { createdAt: 'asc' },
  })

  // 加重平均で原価・税率を算出
  const positions: Position[] = lots.map(l => ({
    id: l.id,
    shares: l.shares,
    purchasePrice: Number(l.purchasePrice),
    purchaseDate: l.purchaseDate ?? '',
    memo: l.memo ?? '',
    taxRate: Number(l.taxRate),
    createdAt: l.createdAt.toISOString(),
  }))
  const summary = calculatePositionSummary(positions)

  if (summary.totalShares <= 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: '売却可能なポジションがありません' },
      { status: 400 }
    )
  }
  if (soldShares > summary.totalShares) {
    return NextResponse.json(
      { error: 'Bad Request', message: `保有株数（${summary.totalShares}株）を超えて売却することはできません` },
      { status: 400 }
    )
  }

  const costBasis = summary.averagePrice
  const taxRate = summary.weightedTaxRate
  const realizedPL = (sellPrice - costBasis) * soldShares

  // 古いロットから消し込む（加重平均法のため順序は実現損益に影響しない）
  let remaining = soldShares
  const lotUpdates: Array<{ id: string; shares: number }> = []
  const lotDeletes: string[] = []
  for (const lot of lots) {
    if (remaining <= 0) break
    if (lot.shares <= remaining) {
      remaining -= lot.shares
      lotDeletes.push(lot.id)
    } else {
      lotUpdates.push({ id: lot.id, shares: lot.shares - remaining })
      remaining = 0
    }
  }

  const [trade] = await prisma.$transaction([
    prisma.realizedTrade.create({
      data: { stockId, soldShares, sellPrice, costBasis, sellDate: resolvedSellDate, realizedPL, taxRate, memo: memo || null },
    }),
    ...lotDeletes.map(id => prisma.stockPosition.delete({ where: { id } })),
    ...lotUpdates.map(u => prisma.stockPosition.update({ where: { id: u.id }, data: { shares: u.shares } })),
  ])

  // 更新後のポジション一覧を返す
  const remainingLots = await prisma.stockPosition.findMany({
    where: { stockId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({
    success: true,
    data: {
      // symbolは銘柄コンテキスト内で既知のため空文字（横断ビューはGET側でsymbolを付与）
      trade: serializeTrade(trade, ''),
      positions: remainingLots.map(p => ({
        id: p.id,
        shares: p.shares,
        purchasePrice: Number(p.purchasePrice),
        purchaseDate: p.purchaseDate ?? '',
        memo: p.memo ?? '',
        taxRate: Number(p.taxRate),
        createdAt: p.createdAt.toISOString(),
      })),
    },
  })
}, 'ポジションの売却')

// GET: 当該銘柄の確定損益履歴を取得（新しい順）
export const GET = withAuth(async ({ user, params }) => {
  const stockIdParam = params.stockId
  if (!stockIdParam || stockIdParam === 'undefined') {
    return NextResponse.json(
      { error: 'Bad Request', message: '無効なstockIdです' },
      { status: 400 }
    )
  }

  const actualStockId = await resolveStockId(stockIdParam, user.id)
  if (!actualStockId) {
    return NextResponse.json({ success: true, data: [] })
  }

  const stock = await prisma.stock.findFirst({ where: { id: actualStockId, userId: user.id }, select: { symbol: true } })
  const trades = await prisma.realizedTrade.findMany({
    where: { stockId: actualStockId },
    orderBy: [{ sellDate: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({
    success: true,
    data: trades.map(t => serializeTrade(t, stock?.symbol ?? '')),
  })
}, '確定損益の取得')
