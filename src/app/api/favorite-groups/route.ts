import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

// GET: ユーザーの全お気に入りグループを取得（銘柄シンボル込み）
export const GET = withAuth(async ({ user }) => {
  const groups = await prisma.favoriteGroup.findMany({
    where: { userId: user.id },
    include: {
      stockGroups: {
        include: { stock: { select: { symbol: true } } }
      }
    },
    orderBy: { order: 'asc' }
  })

  const data = groups.map(g => ({
    id: g.id,
    name: g.name,
    color: g.color,
    order: g.order,
    createdAt: g.createdAt.toISOString(),
    stocks: g.stockGroups.map(sg => sg.stock.symbol)
  }))

  return NextResponse.json({ success: true, data })
}, 'グループの取得')

// POST: 新規グループを作成
export const POST = withAuth(async ({ user, request }) => {
  const { name, color, order } = await request.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'Bad Request', message: 'グループ名は必須です' },
      { status: 400 }
    )
  }

  try {
    const group = await prisma.favoriteGroup.create({
      data: {
        userId: user.id,
        name,
        color: color || 'blue',
        order: order ?? 0
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        color: group.color,
        order: group.order,
        createdAt: group.createdAt.toISOString(),
        stocks: []
      }
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: '同名のグループが既に存在します' },
        { status: 409 }
      )
    }
    throw error
  }
}, 'グループの作成')
