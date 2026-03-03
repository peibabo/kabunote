import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

async function resolveStockId(stockIdParam: string, userId: string): Promise<string | null> {
  if (stockIdParam.startsWith('stock-')) {
    const symbol = stockIdParam.replace('stock-', '')
    const stock = await prisma.stock.findFirst({ where: { userId, symbol } })
    return stock?.id ?? null
  }
  const stock = await prisma.stock.findFirst({ where: { id: stockIdParam, userId } })
  return stock?.id ?? null
}

// DELETE: タグ削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string; tagId: string }> }
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

    const { stockId: rawStockId, tagId } = await params
    const stockId = await resolveStockId(rawStockId, user.id)
    if (!stockId) {
      return NextResponse.json({ error: 'Not Found', message: '銘柄が見つかりません' }, { status: 404 })
    }

    await prisma.stockTag.deleteMany({
      where: { id: tagId, stockId }
    })

    return NextResponse.json({ success: true, message: 'タグを削除しました' })

  } catch (error) {
    console.error('❌ タグ削除エラー:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'タグの削除に失敗しました' },
      { status: 500 }
    )
  }
}
