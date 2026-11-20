import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { buildSnapshotData } from '@/lib/snapshotCalc'
import {
  reconstructPositionsAt,
  validateBackfillDate,
  BACKFILL_DATE_ERROR_MESSAGES,
} from '@/lib/snapshotBackfill'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'
import { isValidRequiredPrice } from '@/lib/validation'
import type { Position } from '@/types/positions'
import type { ConsumedLot } from '@/types/realizedTrade'

// 記録し忘れた日のスナップショットを後から追加する。
// - 保有は「今のポジション＋その日より後に売却したロット」から再現する（クライアントの株数は信用しない）
// - 現金は直前の記録から引き継ぐ（なければ今の現金）
// - XP は付けない（まとめて埋めて稼げないようにする）

interface BackfillStock {
  stockId: string
  symbol: string
  name: string | null
  shares: number
  cost: number
  suggestedPrice: number | null
}

type ContextResult =
  | { ok: true; date: string; stocks: BackfillStock[]; suggestedCash: number; positionsByStock: Map<string, Position[]> }
  | { ok: false; response: NextResponse }

function badRequest(message: string, status = 400) {
  const error = status === 409 ? 'Conflict' : 'Bad Request'
  return NextResponse.json({ error, message }, { status })
}

async function loadBackfillContext(userId: string, date: unknown): Promise<ContextResult> {
  const dateError = validateBackfillDate(date, getTodayJST())
  if (dateError) {
    return { ok: false, response: badRequest(BACKFILL_DATE_ERROR_MESSAGES[dateError]) }
  }
  const dateStr = date as string
  const snapshotDate = dateStrToUTCMidnight(dateStr)

  const existing = await prisma.portfolioSnapshot.findUnique({
    where: { userId_snapshotDate: { userId, snapshotDate } },
    select: { id: true },
  })
  if (existing) {
    return {
      ok: false,
      response: badRequest('この日はすでに記録されています。株価の修正は推移グラフの点をクリックして行ってください', 409),
    }
  }

  const [stocks, prevSnapshot, nextSnapshot, appUser] = await Promise.all([
    prisma.stock.findMany({
      where: { userId },
      include: {
        prices: true,
        positions: true,
        realizedTrades: {
          select: { id: true, sellDate: true, costBasis: true, taxRate: true, consumedLots: true },
        },
      },
    }),
    prisma.portfolioSnapshot.findFirst({
      where: { userId, snapshotDate: { lt: snapshotDate } },
      orderBy: { snapshotDate: 'desc' },
      include: { stockSnapshots: true },
    }),
    prisma.portfolioSnapshot.findFirst({
      where: { userId, snapshotDate: { gt: snapshotDate } },
      orderBy: { snapshotDate: 'asc' },
      include: { stockSnapshots: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { cashAmount: true } }),
  ])

  const priceFrom = (snap: typeof prevSnapshot, stockId: string): number | null => {
    const row = snap?.stockSnapshots.find(s => s.stockId === stockId)
    return row?.currentPrice != null ? Number(row.currentPrice) : null
  }

  const positionsByStock = new Map<string, Position[]>()
  const result: BackfillStock[] = []

  for (const stock of stocks) {
    const positions: Position[] = stock.positions.map(p => ({
      id: p.id,
      shares: p.shares,
      purchasePrice: Number(p.purchasePrice),
      purchaseDate: p.purchaseDate ?? '',
      taxRate: Number(p.taxRate),
      createdAt: p.createdAt.toISOString(),
    }))
    const trades = stock.realizedTrades.map(t => ({
      id: t.id,
      sellDate: t.sellDate,
      costBasis: Number(t.costBasis),
      taxRate: Number(t.taxRate),
      consumedLots: (Array.isArray(t.consumedLots) ? t.consumedLots : []) as unknown as ConsumedLot[],
    }))
    const heldPositions = reconstructPositionsAt(dateStr, positions, trades)
    // 見るだけの銘柄（その日に保有なし）は過去の株価が分からないため含めない
    const built = buildSnapshotData(
      [{ id: stock.id, symbol: stock.symbol, currentPrice: null, positions: heldPositions }],
      0,
    ).stockSnapshots.find(s => s.shares > 0)
    if (!built) continue

    const currentPrice = stock.prices[0]?.currentPrice != null ? Number(stock.prices[0].currentPrice) : null
    positionsByStock.set(stock.id, heldPositions)
    result.push({
      stockId: stock.id,
      symbol: stock.symbol,
      name: stock.name ?? null,
      shares: built.shares,
      cost: built.cost,
      suggestedPrice: priceFrom(prevSnapshot, stock.id) ?? priceFrom(nextSnapshot, stock.id) ?? currentPrice,
    })
  }

  if (result.length === 0) {
    return { ok: false, response: badRequest('この日は保有している銘柄がないため記録できません') }
  }

  const suggestedCash = prevSnapshot ? Number(prevSnapshot.cashAmount) : Number(appUser?.cashAmount ?? 0)

  return { ok: true, date: dateStr, stocks: result, suggestedCash, positionsByStock }
}

// GET ?date=YYYY-MM-DD: 後から追加する日の保有・株価・現金の初期値を返す
export const GET = withAuth(async ({ user, request }) => {
  const date = new URL(request.url).searchParams.get('date')
  const ctx = await loadBackfillContext(user.id, date)
  if (!ctx.ok) return ctx.response

  return NextResponse.json({
    success: true,
    data: { date: ctx.date, stocks: ctx.stocks, suggestedCash: ctx.suggestedCash },
  })
}, '後から追加する記録の取得')

// POST { date, stockPrices: [{stockId, currentPrice}], cashAmount }: 記録し忘れた日のスナップショットを作成
export const POST = withAuth(async ({ user, request }) => {
  const body = await request.json().catch(() => ({}))
  const { date, stockPrices, cashAmount } = body ?? {}

  if (stockPrices !== undefined && !Array.isArray(stockPrices)) {
    return badRequest('stockPricesは配列で指定してください')
  }
  const priceMap = new Map<string, number>()
  for (const sp of (stockPrices ?? []) as unknown[]) {
    const item = sp as { stockId?: unknown; currentPrice?: unknown }
    if (typeof item?.stockId !== 'string' || item.stockId.length === 0) {
      return badRequest('stockIdが不正です')
    }
    if (!isValidRequiredPrice(item.currentPrice)) {
      return badRequest('株価は0より大きい有効な数値である必要があります')
    }
    priceMap.set(item.stockId, item.currentPrice as number)
  }
  if (cashAmount !== undefined && (typeof cashAmount !== 'number' || !Number.isFinite(cashAmount) || cashAmount < 0)) {
    return badRequest('現金は0以上の数値である必要があります')
  }

  const ctx = await loadBackfillContext(user.id, date)
  if (!ctx.ok) return ctx.response

  const held = new Set(ctx.stocks.map(s => s.stockId))
  for (const stockId of priceMap.keys()) {
    if (!held.has(stockId)) {
      return badRequest('この日に保有していない銘柄の株価が含まれています')
    }
  }

  const cash = typeof cashAmount === 'number' ? cashAmount : ctx.suggestedCash
  const snapshotData = buildSnapshotData(
    ctx.stocks.map(s => ({
      id: s.stockId,
      symbol: s.symbol,
      currentPrice: priceMap.get(s.stockId) ?? s.suggestedPrice,
      positions: ctx.positionsByStock.get(s.stockId) ?? [],
    })),
    cash,
  )
  const snapshotDate = dateStrToUTCMidnight(ctx.date)

  let snapshot
  try {
    snapshot = await prisma.$transaction(async (tx) => {
      const created = await tx.portfolioSnapshot.create({
        data: {
          userId: user.id,
          snapshotDate,
          totalInvestment: snapshotData.totalInvestment,
          totalValue: snapshotData.totalValue,
          profitLoss: snapshotData.profitLoss,
          cashAmount: snapshotData.cashAmount,
          netAssets: snapshotData.netAssets,
        },
      })
      await tx.stockPriceSnapshot.createMany({
        data: snapshotData.stockSnapshots.map(s => ({
          snapshotId: created.id,
          stockId: s.stockId,
          symbol: s.symbol,
          currentPrice: s.currentPrice,
          shares: s.shares,
          value: s.value,
          cost: s.cost,
        })),
      })
      return created
    })
  } catch (error) {
    // 同時に追加された（ダブルクリック等）場合
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return badRequest('この日はすでに記録されています', 409)
    }
    throw error
  }

  const nameMap = new Map(ctx.stocks.map(s => [s.stockId, s.name]))
  return NextResponse.json({
    success: true,
    data: {
      id: snapshot.id,
      snapshotDate: ctx.date,
      totalInvestment: snapshotData.totalInvestment,
      totalValue: snapshotData.totalValue,
      profitLoss: snapshotData.profitLoss,
      cashAmount: snapshotData.cashAmount,
      netAssets: snapshotData.netAssets,
      stockSnapshots: snapshotData.stockSnapshots.map(s => ({ ...s, name: nameMap.get(s.stockId) ?? null })),
    },
  })
}, '記録し忘れた日の追加')
