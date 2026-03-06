import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

// PUT: グループ情報を更新
export const PUT = withAuth(async ({ user, request, params }) => {
  const { groupId } = params
  const body = await request.json()
  const { name, color, order } = body

  const existing = await prisma.favoriteGroup.findFirst({
    where: { id: groupId, userId: user.id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not Found', message: 'グループが見つかりません' },
      { status: 404 }
    )
  }

  const updated = await prisma.favoriteGroup.update({
    where: { id: groupId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(order !== undefined && { order })
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      order: updated.order,
      createdAt: updated.createdAt.toISOString()
    }
  })
}, 'グループの更新')

// DELETE: グループを削除（stock_favorite_groups はカスケード削除）
export const DELETE = withAuth(async ({ user, params }) => {
  const { groupId } = params

  const existing = await prisma.favoriteGroup.findFirst({
    where: { id: groupId, userId: user.id }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not Found', message: 'グループが見つかりません' },
      { status: 404 }
    )
  }

  await prisma.favoriteGroup.delete({ where: { id: groupId } })

  return NextResponse.json({ success: true })
}, 'グループの削除')
