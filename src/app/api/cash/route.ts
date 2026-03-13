import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { isValidCashAmount } from '@/lib/validation'

// GET: 現金残高と次の一手メモを取得
export const GET = withAuth(async ({ user }) => {
  const appUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { cashAmount: true, nextActionMemo: true },
  })

  if (!appUser) {
    return NextResponse.json({ cashAmount: '0', nextActionMemo: '' })
  }

  return NextResponse.json({
    cashAmount: appUser.cashAmount?.toString() || '0',
    nextActionMemo: appUser.nextActionMemo || '',
  })
}, '現金残高の取得')

// POST: 現金残高と次の一手メモを更新
export const POST = withAuth(async ({ user, request }) => {
  const { cashAmount, nextActionMemo } = await request.json()

  if (cashAmount !== undefined && cashAmount !== null) {
    if (!isValidCashAmount(cashAmount)) {
      return NextResponse.json({ error: '有効な現金残高を入力してください' }, { status: 400 })
    }
  }

  const updateData: Partial<{ cashAmount: string; nextActionMemo: string }> = {}
  if (cashAmount !== undefined) {
    updateData.cashAmount = cashAmount
  }
  if (nextActionMemo !== undefined) {
    updateData.nextActionMemo = nextActionMemo
  }

  const updatedUser = await prisma.user.upsert({
    where: { id: user.id },
    update: updateData,
    create: {
      id: user.id,
      email: user.email || `temp_${user.id}@example.com`,
      authProvider: 'unknown',
      ...updateData,
    },
    select: { cashAmount: true, nextActionMemo: true },
  })

  return NextResponse.json({
    cashAmount: updatedUser.cashAmount?.toString() || '0',
    nextActionMemo: updatedUser.nextActionMemo || '',
  })
}, '現金残高の更新')
