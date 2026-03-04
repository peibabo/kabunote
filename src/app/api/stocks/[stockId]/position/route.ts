import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'
import { resolveStockId } from '@/lib/resolveStockId'

// GET: 銘柄の全ポジション一覧を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: stockIdParam } = await params

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

  } catch (error) {
    console.error('❌ ポジション一覧取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'ポジションの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新規ポジションを追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: stockIdParam } = await params

    if (!stockIdParam || stockIdParam === 'undefined') {
      return NextResponse.json(
        { error: 'Bad Request', message: '無効なstockIdです' },
        { status: 400 }
      )
    }

    const actualStockId = await resolveStockId(stockIdParam, user.id)
    if (!actualStockId) {
      return NextResponse.json(
        { error: 'Not Found', message: '銘柄が見つかりません' },
        { status: 404 }
      )
    }

    const { shares, purchasePrice, purchaseDate, memo } = await request.json()

    if (typeof shares !== 'number' || shares <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'sharesは1以上の数値である必要があります' },
        { status: 400 }
      )
    }
    if (typeof purchasePrice !== 'number' || purchasePrice <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'purchasePriceは0より大きい数値である必要があります' },
        { status: 400 }
      )
    }

    const position = await prisma.stockPosition.create({
      data: {
        stockId: actualStockId,
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

  } catch (error) {
    console.error('❌ ポジション作成エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'ポジションの作成に失敗しました' },
      { status: 500 }
    )
  }
}
