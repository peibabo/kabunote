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

    // データベースから株式データを価格情報・イベント・配当・優待込みで取得
    const stocks = await prisma.stock.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        order: 'asc'
      },
      include: {
        prices: true,
        positions: {
          orderBy: { createdAt: 'asc' }
        },
        events: true,
        dividend: true,
        benefit: true,
      }
    })

    console.log(`✅ ${stocks.length}件の株式データを取得完了`)

    // フロントエンド形式に変換
    const formattedStocks = stocks.map(stock => {
      const price = stock.prices[0] ?? null
      return {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name || stock.symbol,
        sector: stock.sector,
        market: stock.market,
        order: stock.order,

        currentPrice: price?.currentPrice != null ? Number(price.currentPrice) : null,
        targetPrice: price?.targetPrice != null ? Number(price.targetPrice) : null,
        stopLossPrice: price?.stopLossPrice != null ? Number(price.stopLossPrice) : null,
        memo: '',
        positions: stock.positions.map(p => ({
          id: p.id,
          shares: p.shares,
          purchasePrice: Number(p.purchasePrice),
          purchaseDate: p.purchaseDate ?? '',
          memo: p.memo ?? '',
          createdAt: p.createdAt.toISOString()
        })),
        events: stock.events.map(e => ({
          id: e.id,
          eventType: e.eventType,
          eventDate: e.eventDate ? e.eventDate.toISOString().split('T')[0] : null,
          eventMonth: e.eventMonth,
          eventDay: e.eventDay,
          isRecurring: e.isRecurring,
          isActive: e.isActive,
        })),
        dividend: stock.dividend ? {
          dividendPerShare: stock.dividend.dividendPerShare != null ? Number(stock.dividend.dividendPerShare) : null,
          frequency: stock.dividend.frequency,
          rightsMonth: stock.dividend.rightsMonth,
          rightsDay: stock.dividend.rightsDay,
        } : null,
        benefit: stock.benefit ? {
          description: stock.benefit.description,
          minimumShares: stock.benefit.minimumShares,
          estimatedValue: stock.benefit.estimatedValue != null ? Number(stock.benefit.estimatedValue) : null,
          rightsMonth: stock.benefit.rightsMonth,
          rightsDay: stock.benefit.rightsDay,
        } : null,
        tags: [],
        nextActionPlan: null,

        createdAt: stock.createdAt.toISOString(),
        updatedAt: stock.updatedAt.toISOString()
      }
    })

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