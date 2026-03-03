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

// GET: Next Action Plan取得
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
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    let nextActionPlan = await prisma.nextActionPlan.findUnique({ where: { stockId } })

    if (!nextActionPlan) {
      nextActionPlan = await prisma.nextActionPlan.create({
        data: {
          stockId,
          actionType: 'BUY',
          priority: 'MEDIUM',
          targetPrice: null,
          targetShares: null,
          strategyMemo: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: nextActionPlan.id,
        actionType: nextActionPlan.actionType.toLowerCase(),
        priority: nextActionPlan.priority.toLowerCase(),
        targetPrice: nextActionPlan.targetPrice,
        targetQuantity: nextActionPlan.targetShares,
        memo: nextActionPlan.strategyMemo || '',
        updatedAt: nextActionPlan.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Next Action Plan取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Next Action Planの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: Next Action Plan更新
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

    const { actionType, priority, targetPrice, targetQuantity, memo } = await request.json()

    const validActionTypes = ['buy', 'sell', 'hold']
    const validPriorities = ['high', 'medium', 'low']

    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'actionTypeは buy, sell, hold のいずれかである必要があります' },
        { status: 400 }
      )
    }
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'priorityは high, medium, low のいずれかである必要があります' },
        { status: 400 }
      )
    }

    const dbActionType = actionType.toUpperCase() as 'BUY' | 'SELL' | 'HOLD'
    const dbPriority = priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'

    let nextActionPlan = await prisma.nextActionPlan.findUnique({ where: { stockId } })

    if (nextActionPlan) {
      nextActionPlan = await prisma.nextActionPlan.update({
        where: { stockId },
        data: {
          actionType: dbActionType,
          priority: dbPriority,
          targetPrice,
          targetShares: targetQuantity,
          strategyMemo: memo || null
        }
      })
    } else {
      nextActionPlan = await prisma.nextActionPlan.create({
        data: {
          stockId,
          actionType: dbActionType,
          priority: dbPriority,
          targetPrice,
          targetShares: targetQuantity,
          strategyMemo: memo || null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: nextActionPlan.id,
        actionType: nextActionPlan.actionType.toLowerCase(),
        priority: nextActionPlan.priority.toLowerCase(),
        targetPrice: nextActionPlan.targetPrice,
        targetQuantity: nextActionPlan.targetShares,
        memo: nextActionPlan.strategyMemo || '',
        updatedAt: nextActionPlan.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Next Action Plan更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Next Action Planの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: Next Action Plan削除
export async function DELETE(
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

    await prisma.nextActionPlan.delete({ where: { stockId } })

    return NextResponse.json({ success: true, message: 'Next Action Planを削除しました' })

  } catch (error) {
    console.error('❌ Next Action Plan削除エラー:', error)

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ success: true, message: 'Next Action Planは既に削除されています' })
    }

    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Next Action Planの削除に失敗しました' },
      { status: 500 }
    )
  }
}
