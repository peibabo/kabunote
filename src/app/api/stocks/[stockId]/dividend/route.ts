import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

// GET: 配当情報取得
export const GET = withStock(async ({ stockId }) => {
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
}, '配当情報の取得')

// PUT: 配当情報更新（upsert）
export const PUT = withStock(async ({ stockId, request }) => {
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
}, '配当情報の更新')

// DELETE: 配当情報削除
export const DELETE = withStock(async ({ stockId }) => {
  await prisma.stockDividend.deleteMany({ where: { stockId } })

  return NextResponse.json({ success: true, message: '配当情報を削除しました' })
}, '配当情報の削除')
