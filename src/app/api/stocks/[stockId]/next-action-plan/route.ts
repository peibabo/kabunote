import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

// GET: Next Action Plan取得
export const GET = withStock(async ({ stockId }) => {
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
}, 'Next Action Planの取得')

// PUT: Next Action Plan更新
export const PUT = withStock(async ({ stockId, request }) => {
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
}, 'Next Action Planの更新')

// DELETE: Next Action Plan削除
export const DELETE = withStock(async ({ stockId }) => {
  try {
    await prisma.nextActionPlan.delete({ where: { stockId } })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ success: true, message: 'Next Action Planは既に削除されています' })
    }
    throw error
  }

  return NextResponse.json({ success: true, message: 'Next Action Planを削除しました' })
}, 'Next Action Planの削除')
