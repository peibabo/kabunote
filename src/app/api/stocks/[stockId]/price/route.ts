import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth, withStock } from '@/lib/apiHandler'
import { resolveStockId } from '@/lib/resolveStockId'

// GET: 株価情報取得（stockId未発見時はnullデータ返却、404ではない）
export const GET = withAuth(async ({ user, params }) => {
  const rawStockId = params.stockId
  const stockId = await resolveStockId(rawStockId, user.id)
  if (!stockId) {
    return NextResponse.json({
      success: true,
      data: { currentPrice: null, targetPrice: null, stopLossPrice: null }
    })
  }

  const price = await prisma.stockPrice.findUnique({ where: { stockId } })

  return NextResponse.json({
    success: true,
    data: {
      currentPrice: price?.currentPrice != null ? Number(price.currentPrice) : null,
      targetPrice: price?.targetPrice != null ? Number(price.targetPrice) : null,
      stopLossPrice: price?.stopLossPrice != null ? Number(price.stopLossPrice) : null,
      updatedAt: price?.updatedAt?.toISOString() ?? null
    }
  })
}, '株価の取得')

// PUT: 株価情報更新
export const PUT = withStock(async ({ stockId, request }) => {
  const { currentPrice, targetPrice, stopLossPrice } = await request.json()

  const existing = await prisma.stockPrice.findUnique({ where: { stockId } })
  let price

  if (existing) {
    price = await prisma.stockPrice.update({
      where: { stockId },
      data: {
        currentPrice: currentPrice !== undefined ? (currentPrice || null) : existing.currentPrice,
        targetPrice: targetPrice !== undefined ? (targetPrice || null) : existing.targetPrice,
        stopLossPrice: stopLossPrice !== undefined ? (stopLossPrice || null) : existing.stopLossPrice,
      }
    })
  } else {
    price = await prisma.stockPrice.create({
      data: {
        stockId,
        currentPrice: currentPrice || null,
        targetPrice: targetPrice || null,
        stopLossPrice: stopLossPrice || null,
      }
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      currentPrice: price.currentPrice != null ? Number(price.currentPrice) : null,
      targetPrice: price.targetPrice != null ? Number(price.targetPrice) : null,
      stopLossPrice: price.stopLossPrice != null ? Number(price.stopLossPrice) : null,
      updatedAt: price.updatedAt.toISOString()
    }
  })
}, '株価の更新')
