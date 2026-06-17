import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

// DELETE: 確定損益（売却記録）を削除する。
// レコードを消すだけで、保有ポジション（StockPosition）には一切触れない（株数は戻さない）。
export const DELETE = withAuth(async ({ user, params }) => {
  const { tradeId } = params

  // 所有権チェック（stock経由でuserIdを確認。stock_id経由のRLSとも一致）
  const existing = await prisma.realizedTrade.findFirst({
    where: { id: tradeId, stock: { userId: user.id } }
  })

  if (!existing) {
    return NextResponse.json(
      { error: 'Not Found', message: '確定損益が見つかりません' },
      { status: 404 }
    )
  }

  await prisma.realizedTrade.delete({ where: { id: tradeId } })

  return NextResponse.json({ success: true, message: '売却記録を削除しました' })
}, '確定損益の削除')
