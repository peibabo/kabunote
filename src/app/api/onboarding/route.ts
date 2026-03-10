import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

// GET: オンボーディング完了状態を取得
export const GET = withAuth(async ({ user }) => {
  const appUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { onboardingCompleted: true },
  })

  return NextResponse.json({
    completed: appUser?.onboardingCompleted ?? false,
  })
}, 'オンボーディング状態の取得')

// POST: オンボーディング完了状態を更新
export const POST = withAuth(async ({ user, request }) => {
  const { completed } = await request.json()

  if (typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'completed は boolean で指定してください' }, { status: 400 })
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { onboardingCompleted: completed },
    select: { onboardingCompleted: true },
  })

  return NextResponse.json({
    completed: updatedUser.onboardingCompleted,
  })
}, 'オンボーディング状態の更新')
