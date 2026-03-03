import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// POST: グループに銘柄を追加
export async function POST(
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
    const { symbol } = await request.json()

    if (!symbol) {
      return NextResponse.json(
        { error: 'Bad Request', message: '銘柄コードは必須です' },
        { status: 400 }
      )
    }

    // ユーザーのグループかチェック
    const group = await prisma.favoriteGroup.findFirst({
      where: { id: groupId, userId: user.id }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Not Found', message: 'グループが見つかりません' },
        { status: 404 }
      )
    }

    // ユーザーの銘柄を取得
    const stock = await prisma.stock.findFirst({
      where: { userId: user.id, symbol }
    })

    if (!stock) {
      return NextResponse.json(
        { error: 'Not Found', message: '銘柄が見つかりません' },
        { status: 404 }
      )
    }

    // 中間テーブルに追加（既存の場合は無視）
    await prisma.stockFavoriteGroup.upsert({
      where: {
        stockId_groupId: {
          stockId: stock.id,
          groupId
        }
      },
      create: {
        stockId: stock.id,
        groupId
      },
      update: {}
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ グループ銘柄追加エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '銘柄の追加に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: グループから銘柄を削除
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
    const { symbol } = await request.json()

    if (!symbol) {
      return NextResponse.json(
        { error: 'Bad Request', message: '銘柄コードは必須です' },
        { status: 400 }
      )
    }

    // ユーザーのグループかチェック
    const group = await prisma.favoriteGroup.findFirst({
      where: { id: groupId, userId: user.id }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Not Found', message: 'グループが見つかりません' },
        { status: 404 }
      )
    }

    // ユーザーの銘柄を取得
    const stock = await prisma.stock.findFirst({
      where: { userId: user.id, symbol }
    })

    if (!stock) {
      return NextResponse.json({ success: true }) // 銘柄がなければ削除済みとみなす
    }

    // 中間テーブルから削除
    await prisma.stockFavoriteGroup.deleteMany({
      where: {
        stockId: stock.id,
        groupId
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ グループ銘柄削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '銘柄の削除に失敗しました' },
      { status: 500 }
    )
  }
}
