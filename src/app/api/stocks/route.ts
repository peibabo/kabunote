import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/**
 * app_users にユーザーが存在しなければ作成する
 */
async function ensureUser(user: { id: string; email?: string }) {
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email || `temp_${user.id}@example.com`,
      authProvider: 'unknown',
    },
  })
}

export const POST = withAuth(async ({ user, request }) => {
  const body = await request.json()
  const { symbol, name, sector, market } = body

  if (!symbol || typeof symbol !== 'string') {
    return NextResponse.json(
      { error: 'Bad Request', message: '銘柄コードが必要です' },
      { status: 400 }
    )
  }

  // 重複チェック：既存の場合はそのまま返す
  const existing = await prisma.stock.findFirst({
    where: { userId: user.id, symbol },
  })
  if (existing) {
    if (name || sector || market) {
      await prisma.stock.update({
        where: { id: existing.id },
        data: {
          ...(name && !existing.name ? { name } : {}),
          ...(sector && !existing.sector ? { sector } : {}),
          ...(market && !existing.market ? { market } : {}),
        },
      })
    }
    return NextResponse.json({
      success: true,
      data: { id: existing.id, symbol: existing.symbol },
      existed: true,
    })
  }

  // ユーザーが app_users に存在しなければ作成（外部キー制約対策）
  await ensureUser(user)

  // order は現在の最大値+1
  const maxOrder = await prisma.stock.aggregate({
    where: { userId: user.id },
    _max: { order: true },
  })
  const nextOrder = (maxOrder._max.order ?? -1) + 1

  try {
    const stock = await prisma.stock.create({
      data: {
        userId: user.id,
        symbol,
        name: name || null,
        sector: sector || null,
        market: market || null,
        order: nextOrder,
      },
    })

    return NextResponse.json({
      success: true,
      data: { id: stock.id, symbol: stock.symbol },
      existed: false,
    })
  } catch (createError) {
    // unique制約違反（競合）の場合は再取得
    const fallback = await prisma.stock.findFirst({ where: { userId: user.id, symbol } })
    if (fallback) {
      return NextResponse.json({
        success: true,
        data: { id: fallback.id, symbol: fallback.symbol },
        existed: true,
      })
    }
    throw createError
  }
}, '銘柄の作成')

export const DELETE = withAuth(async ({ user, request }) => {
  const body = await request.json()
  const { symbol } = body

  if (!symbol || typeof symbol !== 'string') {
    return NextResponse.json(
      { error: 'Bad Request', message: '銘柄コードが必要です' },
      { status: 400 }
    )
  }

  const stock = await prisma.stock.findFirst({
    where: { userId: user.id, symbol },
  })
  if (!stock) {
    return NextResponse.json({ success: true, message: '既に削除済みです' })
  }

  // カスケード削除（関連データも含む）
  await prisma.stock.delete({ where: { id: stock.id } })

  return NextResponse.json({ success: true })
}, '銘柄の削除')
