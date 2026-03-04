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

// GET: 優待情報取得
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

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    const benefit = await prisma.stockBenefit.findUnique({ where: { stockId } })

    return NextResponse.json({
      success: true,
      data: benefit ? {
        description: benefit.description,
        minimumShares: benefit.minimumShares,
        estimatedValue: benefit.estimatedValue != null ? Number(benefit.estimatedValue) : null,
        rightsMonth: benefit.rightsMonth,
        rightsDay: benefit.rightsDay,
      } : null
    })

  } catch (error) {
    console.error('❌ 優待情報取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '優待情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 優待情報更新（upsert）
export async function PUT(
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

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    const body = await request.json()
    const { description, minimumShares, estimatedValue, rightsMonth, rightsDay } = body

    const existing = await prisma.stockBenefit.findUnique({ where: { stockId } })

    const data = {
      description: description ?? null,
      minimumShares: minimumShares ?? null,
      estimatedValue: estimatedValue != null ? estimatedValue : null,
      rightsMonth: rightsMonth ?? null,
      rightsDay: rightsDay ?? null,
    }

    let benefit
    if (existing) {
      benefit = await prisma.stockBenefit.update({ where: { stockId }, data })
    } else {
      benefit = await prisma.stockBenefit.create({ data: { stockId, ...data } })
    }

    return NextResponse.json({
      success: true,
      data: {
        description: benefit.description,
        minimumShares: benefit.minimumShares,
        estimatedValue: benefit.estimatedValue != null ? Number(benefit.estimatedValue) : null,
        rightsMonth: benefit.rightsMonth,
        rightsDay: benefit.rightsDay,
      }
    })

  } catch (error) {
    console.error('❌ 優待情報更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '優待情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 優待情報削除
export async function DELETE(
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

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    await prisma.stockBenefit.deleteMany({ where: { stockId } })

    return NextResponse.json({ success: true, message: '優待情報を削除しました' })

  } catch (error) {
    console.error('❌ 優待情報削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '優待情報の削除に失敗しました' },
      { status: 500 }
    )
  }
}
