import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET: ユーザーの全お気に入りグループを取得（銘柄シンボル込み）
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const groups = await prisma.favoriteGroup.findMany({
      where: { userId: user.id },
      include: {
        stockGroups: {
          include: {
            stock: {
              select: { symbol: true }
            }
          }
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

  } catch (error) {
    console.error('❌ お気に入りグループ取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'グループの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// POST: 新規グループを作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { name, color, order } = await request.json()

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'グループ名は必須です' },
        { status: 400 }
      )
    }

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
    // ユニーク制約違反（同名グループ）
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflict', message: '同名のグループが既に存在します' },
        { status: 409 }
      )
    }
    console.error('❌ お気に入りグループ作成エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'グループの作成に失敗しました' },
      { status: 500 }
    )
  }
}
