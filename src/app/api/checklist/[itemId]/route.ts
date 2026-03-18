import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/** DELETE: チェックリスト項目削除 */
export const DELETE = withAuth(async ({ user, params }) => {
  const itemId = params.itemId as string

  // ユーザーの項目か確認
  const item = await prisma.userChecklist.findFirst({
    where: { id: itemId, userId: user.id },
  })

  if (!item) {
    return NextResponse.json(
      { error: 'Not Found', message: '項目が見つかりません' },
      { status: 404 }
    )
  }

  await prisma.userChecklist.delete({ where: { id: itemId } })

  return NextResponse.json({ success: true })
}, 'チェックリスト項目削除')
