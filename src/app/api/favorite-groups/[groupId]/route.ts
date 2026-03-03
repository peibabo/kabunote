import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// PUT: グループ情報を更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { groupId } = await params
    const body = await request.json()
    const { name, color, order } = body

    // ユーザーのグループかチェック
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

  } catch (error) {
    console.error('❌ お気に入りグループ更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'グループの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: グループを削除（stock_favorite_groups はカスケード削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { groupId } = await params

    // ユーザーのグループかチェック
    const existing = await prisma.favoriteGroup.findFirst({
      where: { id: groupId, userId: user.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'グループが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.favoriteGroup.delete({
      where: { id: groupId }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ お気に入りグループ削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'グループの削除に失敗しました' },
      { status: 500 }
    )
  }
}
