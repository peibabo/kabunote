import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/** POST: チェック登録 */
export const POST = withAuth(async ({ user, request }) => {
  const { checklistId } = await request.json() as { checklistId: string }

  // ユーザーの項目か確認
  const item = await prisma.userChecklist.findFirst({
    where: { id: checklistId, userId: user.id },
  })

  if (!item) {
    return NextResponse.json(
      { error: 'Not Found', message: '項目が見つかりません' },
      { status: 404 }
    )
  }

  const today = new Date(new Date().toISOString().slice(0, 10))

  // upsertで重複防止
  await prisma.checklistCheck.upsert({
    where: {
      checklistId_checkedDate: {
        checklistId,
        checkedDate: today,
      },
    },
    create: {
      checklistId,
      userId: user.id,
      checkedDate: today,
    },
    update: {},
  })

  return NextResponse.json({ success: true })
}, 'チェック登録')

/** DELETE: チェック解除 */
export const DELETE = withAuth(async ({ user, request }) => {
  const { checklistId } = await request.json() as { checklistId: string }

  const today = new Date(new Date().toISOString().slice(0, 10))

  // ユーザーの項目か確認してから削除
  await prisma.checklistCheck.deleteMany({
    where: {
      checklistId,
      userId: user.id,
      checkedDate: today,
    },
  })

  return NextResponse.json({ success: true })
}, 'チェック解除')
