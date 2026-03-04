import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET: ユーザーの全銘柄にまたがるタグ一覧を取得（使用頻度順）
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    // ユーザーの全銘柄に紐付くタグを取得
    const tags = await prisma.stockTag.findMany({
      where: {
        stock: { userId: user.id }
      },
      select: {
        name: true,
        color: true,
      }
    })

    // (name, color) でユニーク集約 & 出現回数カウント
    const countMap = new Map<string, { label: string; color: string; count: number }>()
    for (const tag of tags) {
      const key = `${tag.name}::${tag.color}`
      const existing = countMap.get(key)
      if (existing) {
        existing.count++
      } else {
        countMap.set(key, { label: tag.name, color: tag.color, count: 1 })
      }
    }

    // 出現回数の多い順にソート
    const result = Array.from(countMap.values()).sort((a, b) => b.count - a.count)

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('❌ 全タグ取得エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'タグの取得に失敗しました' },
      { status: 500 }
    )
  }
}

// PUT: タグ名・色を全銘柄にまたがって一括変更
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { oldLabel, newLabel, newColor } = body

    if (!oldLabel || !newLabel || !newColor) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'oldLabel, newLabel, newColor は必須です' },
        { status: 400 }
      )
    }

    // ユーザーの銘柄に紐付くタグを一括更新
    await prisma.stockTag.updateMany({
      where: {
        name: oldLabel,
        stock: { userId: user.id }
      },
      data: {
        name: newLabel,
        color: newColor
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ タグ一括更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'タグの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: タグを全銘柄にまたがって一括削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { label } = body

    if (!label) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'label は必須です' },
        { status: 400 }
      )
    }

    await prisma.stockTag.deleteMany({
      where: {
        name: label,
        stock: { userId: user.id }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ タグ一括削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'タグの削除に失敗しました' },
      { status: 500 }
    )
  }
}
