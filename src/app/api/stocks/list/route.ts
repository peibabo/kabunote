import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Supabaseクライアントを作成して認証状態を確認
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    console.log('📊 株式データ取得開始 - ユーザーID:', user.id)

    // データベースから株式データを取得（まずはシンプルに基本情報のみ）
    const stocks = await prisma.stock.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        order: 'asc'
      }
    })

    console.log(`✅ ${stocks.length}件の株式データを取得完了`)

    // フロントエンド形式に変換（シンプル版）
    const formattedStocks = stocks.map(stock => ({
      id: stock.id,
      symbol: stock.symbol,
      name: stock.name || stock.symbol, // 名前がnullの場合はシンボルを使用
      sector: stock.sector,
      market: stock.market,
      order: stock.order,

      // 一時的にデフォルト値を設定（後で関連データから取得）
      currentPrice: null,
      targetPrice: null,
      stopLossPrice: null,
      memo: '',
      position: null,
      events: [],
      dividend: null,
      benefit: null,
      tags: [],
      nextActionPlan: null,

      // 作成・更新日時
      createdAt: stock.createdAt.toISOString(),
      updatedAt: stock.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: formattedStocks,
      count: formattedStocks.length
    })

  } catch (error) {
    console.error('❌ 株式データ取得エラー:', error)
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'データの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}