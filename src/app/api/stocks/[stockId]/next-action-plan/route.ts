import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET: Next Action Plan取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId } = await params
    console.log('📊 Next Action Plan API - 受信したstockId:', stockId);

    // Next Action Plan取得（存在しない場合は自動作成）
    let nextActionPlan = await prisma.nextActionPlan.findUnique({
      where: { stockId }
    })
    console.log('📊 既存のNext Action Plan:', nextActionPlan);

    // Next Action Planが存在しない場合はデフォルト値で作成
    if (!nextActionPlan) {
      console.log('📊 Next Action Plan作成を試行中:', stockId);

      // まず、株式が存在するか確認
      const stock = await prisma.stock.findUnique({
        where: { id: stockId }
      });
      console.log('📊 対応する株式レコード:', stock);

      if (!stock) {
        console.error('❌ 株式が見つかりません:', stockId);
        return NextResponse.json({ error: '株式が見つかりません' }, { status: 404 });
      }

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
      {
        error: 'Internal Server Error',
        message: 'Next Action Planの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId } = await params
    const {
      actionType,
      priority,
      targetPrice,
      targetQuantity,
      memo
    } = await request.json()

    // ActionType、Priorityの変換（小文字 → 大文字）
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

    // Next Action Plan更新（手動でupsert）
    let nextActionPlan = await prisma.nextActionPlan.findUnique({
      where: { stockId }
    })

    const dbActionType = actionType.toUpperCase() as 'BUY' | 'SELL' | 'HOLD'
    const dbPriority = priority.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW'

    if (nextActionPlan) {
      // 既存レコードの更新
      nextActionPlan = await prisma.nextActionPlan.update({
        where: { stockId },
        data: {
          actionType: dbActionType,
          priority: dbPriority,
          targetPrice: targetPrice,
          targetShares: targetQuantity,
          strategyMemo: memo || null
        }
      })
    } else {
      // 新規レコードの作成
      nextActionPlan = await prisma.nextActionPlan.create({
        data: {
          stockId,
          actionType: dbActionType,
          priority: dbPriority,
          targetPrice: targetPrice,
          targetShares: targetQuantity,
          strategyMemo: memo || null
        }
      })
    }

    console.log(`✅ Next Action Plan更新成功 - 株ID: ${stockId}, アクション: ${actionType}, 優先度: ${priority}`)

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
      {
        error: 'Internal Server Error',
        message: 'Next Action Planの更新に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId } = await params

    // Next Action Plan削除
    await prisma.nextActionPlan.delete({
      where: { stockId }
    })

    console.log(`✅ Next Action Plan削除成功 - 株ID: ${stockId}`)

    return NextResponse.json({
      success: true,
      message: 'Next Action Planを削除しました'
    })

  } catch (error) {
    console.error('❌ Next Action Plan削除エラー:', error)

    // 存在しないレコードの削除試行の場合
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({
        success: true,
        message: 'Next Action Planは既に削除されています'
      })
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Next Action Planの削除に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}