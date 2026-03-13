import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock, toNumber } from '@/lib/apiHandler'
import { isValidPrice, isValidFrequency, isValidMonth, isValidDay } from '@/lib/validation'

// GET: 配当情報取得
export const GET = withStock(async ({ stockId }) => {
  const dividend = await prisma.stockDividend.findUnique({ where: { stockId } })

  return NextResponse.json({
    success: true,
    data: dividend ? {
      dividendPerShare: toNumber(dividend.dividendPerShare),
      frequency: dividend.frequency,
      rightsMonth: dividend.rightsMonth,
      rightsDay: dividend.rightsDay,
    } : null
  })
}, '配当情報の取得')

// PUT: 配当情報更新（upsert）
export const PUT = withStock(async ({ stockId, request }) => {
  const body = await request.json()
  const { dividendPerShare, frequency, rightsMonth, rightsDay } = body

  if (!isValidPrice(dividendPerShare) || !isValidFrequency(frequency) || !isValidMonth(rightsMonth) || !isValidDay(rightsDay)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '配当情報に無効な値が含まれています' },
      { status: 400 }
    )
  }

  const data = {
    dividendPerShare: dividendPerShare != null ? dividendPerShare : null,
    frequency: frequency ?? 1,
    rightsMonth: rightsMonth ?? null,
    rightsDay: rightsDay ?? null,
  }

  const dividend = await prisma.stockDividend.upsert({
    where: { stockId },
    update: data,
    create: { stockId, ...data }
  })

  return NextResponse.json({
    success: true,
    data: {
      dividendPerShare: toNumber(dividend.dividendPerShare),
      frequency: dividend.frequency,
      rightsMonth: dividend.rightsMonth,
      rightsDay: dividend.rightsDay,
    }
  })
}, '配当情報の更新')

// DELETE: 配当情報削除
export const DELETE = withStock(async ({ stockId }) => {
  await prisma.stockDividend.deleteMany({ where: { stockId } })

  return NextResponse.json({ success: true, message: '配当情報を削除しました' })
}, '配当情報の削除')
