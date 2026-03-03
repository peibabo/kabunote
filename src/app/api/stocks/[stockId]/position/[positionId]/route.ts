import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// PUT: 特定ポジションの更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string; positionId: string }> }
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

    const { positionId } = await params
    const { shares, purchasePrice, purchaseDate, memo } = await request.json()

    if (typeof shares !== 'number' || shares <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'sharesは1以上の数値である必要があります' },
        { status: 400 }
      )
    }
    if (typeof purchasePrice !== 'number' || purchasePrice <= 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'purchasePriceは0より大きい数値である必要があります' },
        { status: 400 }
      )
    }

    // ポジションが存在することを確認（セキュリティ: 他ユーザーのポジションを操作できないように）
    const existing = await prisma.stockPosition.findFirst({
      where: {
        id: positionId,
        stock: { userId: user.id }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ポジションが見つかりません' },
        { status: 404 }
      )
    }

    const updated = await prisma.stockPosition.update({
      where: { id: positionId },
      data: {
        shares,
        purchasePrice,
        purchaseDate: purchaseDate || null,
        memo: memo || null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        shares: updated.shares,
        purchasePrice: Number(updated.purchasePrice),
        purchaseDate: updated.purchaseDate ?? '',
        memo: updated.memo ?? '',
        createdAt: updated.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ ポジション更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'ポジションの更新に失敗しました' },
      { status: 500 }
    )
  }
}

// DELETE: 特定ポジションの削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string; positionId: string }> }
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

    const { positionId } = await params

    // ポジションが存在することを確認（セキュリティ: 他ユーザーのポジションを操作できないように）
    const existing = await prisma.stockPosition.findFirst({
      where: {
        id: positionId,
        stock: { userId: user.id }
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Not Found', message: 'ポジションが見つかりません' },
        { status: 404 }
      )
    }

    await prisma.stockPosition.delete({
      where: { id: positionId }
    })

    return NextResponse.json({ success: true, message: 'ポジションを削除しました' })

  } catch (error) {
    console.error('❌ ポジション削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'ポジションの削除に失敗しました' },
      { status: 500 }
    )
  }
}
