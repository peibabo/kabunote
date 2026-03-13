import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withStock } from '@/lib/apiHandler'
import { resolveStockId } from '@/lib/resolveStockId'
import { isValidRequiredShares, isValidRequiredPrice } from '@/lib/validation'

// GET: 銘柄の全ポジション一覧を取得（stockId未発見時は空配列返却）
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

  const positions = await prisma.stockPosition.findMany({
    where: { stockId: actualStockId },
    orderBy: { createdAt: 'asc' }
  })

  const data = positions.map(p => ({
    id: p.id,
    shares: p.shares,
    purchasePrice: Number(p.purchasePrice),
    purchaseDate: p.purchaseDate ?? '',
    memo: p.memo ?? '',
    createdAt: p.createdAt.toISOString()
  }))

  return NextResponse.json({ success: true, data })
}, 'ポジションの取得')

// POST: 新規ポジションを追加
export const POST = withStock(async ({ stockId, request }) => {
  const { shares, purchasePrice, purchaseDate, memo } = await request.json()

  if (!isValidRequiredShares(shares)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'sharesは1以上の有効な数値である必要があります' },
      { status: 400 }
    )
  }
  if (!isValidRequiredPrice(purchasePrice)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'purchasePriceは0より大きい有効な数値である必要があります' },
      { status: 400 }
    )
  }

  const position = await prisma.stockPosition.create({
    data: {
      stockId,
      shares,
      purchasePrice,
      purchaseDate: purchaseDate || null,
      memo: memo || null
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      id: position.id,
      shares: position.shares,
      purchasePrice: Number(position.purchasePrice),
      purchaseDate: position.purchaseDate ?? '',
      memo: position.memo ?? '',
      createdAt: position.createdAt.toISOString()
    }
  })
}, 'ポジションの作成')
