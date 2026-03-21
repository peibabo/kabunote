import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

// POST: グループに銘柄を追加
export const POST = withAuth(async ({ user, request, params }) => {
  const { groupId } = params
  const { symbol } = await request.json()

  if (!symbol) {
    return NextResponse.json(
      { error: 'Bad Request', message: '銘柄コードは必須です' },
      { status: 400 }
    )
  }

  const [group, stock] = await Promise.all([
    prisma.favoriteGroup.findFirst({ where: { id: groupId, userId: user.id } }),
    prisma.stock.findFirst({ where: { userId: user.id, symbol } }),
  ])

  if (!group) {
    return NextResponse.json(
      { error: 'Not Found', message: 'グループが見つかりません' },
      { status: 404 }
    )
  }

  if (!stock) {
    return NextResponse.json(
      { error: 'Not Found', message: '銘柄が見つかりません' },
      { status: 404 }
    )
  }

  await prisma.stockFavoriteGroup.upsert({
    where: { stockId_groupId: { stockId: stock.id, groupId } },
    create: { stockId: stock.id, groupId },
    update: {}
  })

  return NextResponse.json({ success: true })
}, '銘柄の追加')

// DELETE: グループから銘柄を削除
export const DELETE = withAuth(async ({ user, request, params }) => {
  const { groupId } = params
  const { symbol } = await request.json()

  if (!symbol) {
    return NextResponse.json(
      { error: 'Bad Request', message: '銘柄コードは必須です' },
      { status: 400 }
    )
  }

  const [group, stock] = await Promise.all([
    prisma.favoriteGroup.findFirst({ where: { id: groupId, userId: user.id } }),
    prisma.stock.findFirst({ where: { userId: user.id, symbol } }),
  ])

  if (!group) {
    return NextResponse.json(
      { error: 'Not Found', message: 'グループが見つかりません' },
      { status: 404 }
    )
  }

  if (!stock) {
    return NextResponse.json({ success: true })
  }

  await prisma.stockFavoriteGroup.deleteMany({
    where: { stockId: stock.id, groupId }
  })

  return NextResponse.json({ success: true })
}, '銘柄の削除')
