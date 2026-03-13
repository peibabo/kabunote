import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'
import { isValidOptionalShares, isValidPrice, isValidMonth, isValidDay } from '@/lib/validation'

// GET: 優待情報取得
export const GET = withStock(async ({ stockId }) => {
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
}, '優待情報の取得')

// PUT: 優待情報更新（upsert）
export const PUT = withStock(async ({ stockId, request }) => {
  const body = await request.json()
  const { description, minimumShares, estimatedValue, rightsMonth, rightsDay } = body

  if (!isValidOptionalShares(minimumShares) || !isValidPrice(estimatedValue) || !isValidMonth(rightsMonth) || !isValidDay(rightsDay)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '優待情報に無効な値が含まれています' },
      { status: 400 }
    )
  }

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
}, '優待情報の更新')

// DELETE: 優待情報削除
export const DELETE = withStock(async ({ stockId }) => {
  await prisma.stockBenefit.deleteMany({ where: { stockId } })

  return NextResponse.json({ success: true, message: '優待情報を削除しました' })
}, '優待情報の削除')
