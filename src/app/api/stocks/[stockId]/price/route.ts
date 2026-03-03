import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function resolveStockId(stockIdParam: string, userId: string): Promise<string | null> {
  if (stockIdParam.startsWith('stock-')) {
    const symbol = stockIdParam.replace('stock-', '')
    const stock = await prisma.stock.findFirst({ where: { userId, symbol } })
    return stock?.id ?? null
  }
  const stock = await prisma.stock.findFirst({ where: { id: stockIdParam, userId } })
  return stock?.id ?? null
}

// GET: 株価情報取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: '認証が必要です' }, { status: 401 })
    }

    const { stockId: rawStockId } = await params
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

  } catch (error) {
    console.error('❌ 株価取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '株価の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 株価情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized', message: '認証が必要です' }, { status: 401 })
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

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

  } catch (error) {
    console.error('❌ 株価更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '株価の更新に失敗しました' },
      { status: 500 }
    )
  }
}
