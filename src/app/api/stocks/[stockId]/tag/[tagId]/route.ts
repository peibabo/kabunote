import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

// DELETE: タグ削除
export const DELETE = withStock(async ({ stockId, params }) => {
  const { tagId } = params

  await prisma.stockTag.deleteMany({ where: { id: tagId, stockId } })

  return NextResponse.json({ success: true, message: 'タグを削除しました' })
}, 'タグの削除')
