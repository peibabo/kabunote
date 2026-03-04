import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function resolveStockId(stockIdParam: string, userId: string): Promise<string | null> {
  if (stockIdParam.startsWith('stock-')) {
    const symbol = stockIdParam.replace('stock-', '')
    // 既存の銘柄を検索し、なければ末尾順で新規作成（新銘柄追加時の lazy 登録）
    const existing = await prisma.stock.findFirst({ where: { userId, symbol } })
    if (existing) return existing.id

    try {
      const maxOrder = await prisma.stock.aggregate({
        where: { userId },
        _max: { order: true },
      })
      const nextOrder = (maxOrder._max.order ?? -1) + 1
      const stock = await prisma.stock.create({
        data: { userId, symbol, name: null, sector: null, market: null, order: nextOrder },
      })
      return stock.id
    } catch {
      // unique制約違反（競合）の場合は再取得
      const fallback = await prisma.stock.findFirst({ where: { userId, symbol } })
      return fallback?.id ?? null
    }
  }
  const stock = await prisma.stock.findFirst({ where: { id: stockIdParam, userId } })
  return stock?.id ?? null
}

// GET: 株ノオト取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    // 株ノオト取得（存在しない場合は自動作成）
    let memo = await prisma.stockMemo.findUnique({
      where: { stockId }
    })

    // 株ノオトが存在しない場合は空の内容で作成
    if (!memo) {
      memo = await prisma.stockMemo.create({
        data: {
          stockId,
          content: ''
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: memo.id,
        content: memo.content,
        updatedAt: memo.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 株ノオト取得エラー:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: '株ノオトの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT: 株ノオト更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }
    const { content } = await request.json()

    // 入力検証
    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'contentは文字列である必要があります' },
        { status: 400 }
      )
    }

    // 株ノオト更新（手動でupsert: 存在しない場合は作成）
    let memo = await prisma.stockMemo.findUnique({
      where: { stockId }
    })

    if (memo) {
      // 既存レコードの更新
      memo = await prisma.stockMemo.update({
        where: { stockId },
        data: { content }
      })
    } else {
      // 新規レコードの作成
      memo = await prisma.stockMemo.create({
        data: {
          stockId,
          content
        }
      })
    }

    console.log(`✅ 株ノオト更新成功 - 株ID: ${stockId}, 文字数: ${content.length}`)

    return NextResponse.json({
      success: true,
      data: {
        id: memo.id,
        content: memo.content,
        updatedAt: memo.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 株ノオト更新エラー:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: '株ノオトの更新に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE: 株ノオト削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  try {
    // 認証確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { stockId: rawStockId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    // 株ノオト削除
    await prisma.stockMemo.delete({
      where: { stockId }
    })

    console.log(`✅ 株ノオト削除成功 - 株ID: ${stockId}`)

    return NextResponse.json({
      success: true,
      message: '株ノオトを削除しました'
    })

  } catch (error) {
    console.error('❌ 株ノオト削除エラー:', error)

    // 存在しないレコードの削除試行の場合
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({
        success: true,
        message: '株ノオトは既に削除されています'
      })
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: '株ノオトの削除に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}