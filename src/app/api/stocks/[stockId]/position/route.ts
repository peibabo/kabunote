import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// GET: 株式ポジション取得
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

    const { stockId } = await params

    // 株式ポジション・価格情報取得（存在しない場合は自動作成）
    let position = await prisma.stockPosition.findUnique({
      where: { stockId }
    })

    let price = await prisma.stockPrice.findUnique({
      where: { stockId }
    })

    // ポジションが存在しない場合は空の内容で作成
    if (!position) {
      position = await prisma.stockPosition.create({
        data: {
          stockId,
          shares: 0,
          averagePrice: null,
          totalInvestment: null
        }
      })
    }

    // 価格情報が存在しない場合は空の内容で作成
    if (!price) {
      price = await prisma.stockPrice.create({
        data: {
          stockId,
          currentPrice: null,
          targetPrice: null,
          stopLossPrice: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: position.id,
        sharesOwned: position.shares,
        averagePurchasePrice: position.averagePrice,
        currentPrice: price.currentPrice,
        profitTarget: price.targetPrice,
        lossLimit: price.stopLossPrice,
        updatedAt: position.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 株式ポジション取得エラー:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: '株式ポジションの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// PUT: 株式ポジション更新
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

    const { stockId } = await params
    const {
      sharesOwned,
      averagePurchasePrice,
      currentPrice,
      profitTarget,
      lossLimit
    } = await request.json()

    // 入力検証
    if (typeof sharesOwned !== 'number' || sharesOwned < 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'sharesOwnedは0以上の数値である必要があります' },
        { status: 400 }
      )
    }

    // 総投資額を計算（保有株数 × 平均取得価格）
    const totalInvestment = (sharesOwned && averagePurchasePrice) ? sharesOwned * averagePurchasePrice : null

    // ポジション情報更新（手動でupsert）
    let position = await prisma.stockPosition.findUnique({
      where: { stockId }
    })

    if (position) {
      // 既存レコードの更新
      position = await prisma.stockPosition.update({
        where: { stockId },
        data: {
          shares: sharesOwned,
          averagePrice: averagePurchasePrice,
          totalInvestment: totalInvestment
        }
      })
    } else {
      // 新規レコードの作成
      position = await prisma.stockPosition.create({
        data: {
          stockId,
          shares: sharesOwned,
          averagePrice: averagePurchasePrice,
          totalInvestment: totalInvestment
        }
      })
    }

    // 価格情報更新（手動でupsert）
    let price = await prisma.stockPrice.findUnique({
      where: { stockId }
    })

    if (price) {
      // 既存レコードの更新
      price = await prisma.stockPrice.update({
        where: { stockId },
        data: {
          currentPrice: currentPrice,
          targetPrice: profitTarget,
          stopLossPrice: lossLimit
        }
      })
    } else {
      // 新規レコードの作成
      price = await prisma.stockPrice.create({
        data: {
          stockId,
          currentPrice: currentPrice,
          targetPrice: profitTarget,
          stopLossPrice: lossLimit
        }
      })
    }

    console.log(`✅ 株式ポジション更新成功 - 株ID: ${stockId}, 保有株数: ${sharesOwned}`)

    return NextResponse.json({
      success: true,
      data: {
        id: position.id,
        sharesOwned: position.shares,
        averagePurchasePrice: position.averagePrice,
        currentPrice: price.currentPrice,
        profitTarget: price.targetPrice,
        lossLimit: price.stopLossPrice,
        updatedAt: position.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('❌ 株式ポジション更新エラー:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: '株式ポジションの更新に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE: 株式ポジション削除
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

    const { stockId } = await params

    // ポジション・価格情報削除
    await prisma.stockPosition.delete({
      where: { stockId }
    })

    // 価格情報も削除（存在する場合のみ）
    try {
      await prisma.stockPrice.delete({
        where: { stockId }
      })
    } catch (error) {
      // 価格情報が存在しない場合はエラーを無視
      console.log('📋 価格情報は存在しませんでした:', stockId)
    }

    console.log(`✅ 株式ポジション削除成功 - 株ID: ${stockId}`)

    return NextResponse.json({
      success: true,
      message: '株式ポジションを削除しました'
    })

  } catch (error) {
    console.error('❌ 株式ポジション削除エラー:', error)

    // 存在しないレコードの削除試行の場合
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({
        success: true,
        message: '株式ポジションは既に削除されています'
      })
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: '株式ポジションの削除に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}