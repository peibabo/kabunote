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

// GET: 配当情報取得
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

    const dividend = await prisma.stockDividend.findUnique({ where: { stockId } })

    return NextResponse.json({
      success: true,
      data: dividend ? {
        dividendPerShare: dividend.dividendPerShare != null ? Number(dividend.dividendPerShare) : null,
        frequency: dividend.frequency,
        rightsMonth: dividend.rightsMonth,
        rightsDay: dividend.rightsDay,
      } : null
    })

  } catch (error) {
    console.error('❌ 配当情報取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '配当情報の取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: 配当情報更新（upsert）
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
    const { dividendPerShare, frequency, rightsMonth, rightsDay } = body

    const existing = await prisma.stockDividend.findUnique({ where: { stockId } })

    const data = {
      dividendPerShare: dividendPerShare != null ? dividendPerShare : null,
      frequency: frequency ?? 1,
      rightsMonth: rightsMonth ?? null,
      rightsDay: rightsDay ?? null,
    }

    let dividend
    if (existing) {
      dividend = await prisma.stockDividend.update({ where: { stockId }, data })
    } else {
      dividend = await prisma.stockDividend.create({ data: { stockId, ...data } })
    }

    return NextResponse.json({
      success: true,
      data: {
        dividendPerShare: dividend.dividendPerShare != null ? Number(dividend.dividendPerShare) : null,
        frequency: dividend.frequency,
        rightsMonth: dividend.rightsMonth,
        rightsDay: dividend.rightsDay,
      }
    })

  } catch (error) {
    console.error('❌ 配当情報更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '配当情報の更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 配当情報削除
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

    await prisma.stockDividend.deleteMany({ where: { stockId } })

    return NextResponse.json({ success: true, message: '配当情報を削除しました' })

  } catch (error) {
    console.error('❌ 配当情報削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '配当情報の削除に失敗しました' },
      { status: 500 }
    )
  }
}
