import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { isValidRequiredShares, isValidRequiredPrice } from '@/lib/validation'

// PUT: 特定ポジションの更新
export const PUT = withAuth(async ({ user, request, params }) => {
  const { positionId } = params
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

  const existing = await prisma.stockPosition.findFirst({
    where: { id: positionId, stock: { userId: user.id } }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not Found', message: 'ポジションが見つかりません' },
      { status: 404 }
    )
  }

  const updated = await prisma.stockPosition.update({
    where: { id: positionId },
    data: {
      shares,
      purchasePrice,
      purchaseDate: purchaseDate || null,
      memo: memo || null
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      shares: updated.shares,
      purchasePrice: Number(updated.purchasePrice),
      purchaseDate: updated.purchaseDate ?? '',
      memo: updated.memo ?? '',
      createdAt: updated.createdAt.toISOString()
    }
  })
}, 'ポジションの更新')

// DELETE: 特定ポジションの削除
export const DELETE = withAuth(async ({ user, params }) => {
  const { positionId } = params

  const existing = await prisma.stockPosition.findFirst({
    where: { id: positionId, stock: { userId: user.id } }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not Found', message: 'ポジションが見つかりません' },
      { status: 404 }
    )
  }

  await prisma.stockPosition.delete({ where: { id: positionId } })

  return NextResponse.json({ success: true, message: 'ポジションを削除しました' })
}, 'ポジションの削除')
