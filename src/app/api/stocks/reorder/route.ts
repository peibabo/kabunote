import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

// PATCH: 銘柄並び順を一括更新
// リクエストボディ: { symbols: string[] }  例: ["7203", "9984", "6758"]
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: '認証が必要です' },
        { status: 401 }
      )
    }

    const { symbols } = await request.json()

    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'symbols は配列である必要があります' },
        { status: 400 }
      )
    }

    // トランザクションで各銘柄のorderをindex値で更新（自分の銘柄のみ）
    await prisma.$transaction(
      symbols.map((symbol: string, index: number) =>
        prisma.stock.updateMany({
          where: { userId: user.id, symbol },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ 並び順更新エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: '並び順の更新に失敗しました' },
      { status: 500 }
    )
  }
}
