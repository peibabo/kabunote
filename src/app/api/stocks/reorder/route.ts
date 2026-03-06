import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

export const PATCH = withAuth(async ({ user, request }) => {
  const { symbols } = await request.json()

  if (!Array.isArray(symbols)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'symbols は配列である必要があります' },
      { status: 400 }
    )
  }

  await prisma.$transaction(
    symbols.map((symbol: string, index: number) =>
      prisma.stock.updateMany({
        where: { userId: user.id, symbol },
        data: { order: index },
      })
    )
  )

  return NextResponse.json({ success: true })
}, '並び順の更新')
