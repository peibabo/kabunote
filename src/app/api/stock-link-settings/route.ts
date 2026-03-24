import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { VALID_STOCK_LINK_KEYS, STOCK_LINK_COUNT } from '@/lib/stockExternalLinks'

// GET: ユーザーの銘柄リンク設定取得
export const GET = withAuth(async ({ user }) => {
  const record = await prisma.userStockLinkSetting.findUnique({
    where: { userId: user.id },
    select: { settings: true },
  })

  if (!record) {
    return NextResponse.json({ success: true, data: null })
  }

  return NextResponse.json({ success: true, data: record.settings })
}, '銘柄リンク設定の取得')

// PUT: 銘柄リンク設定を更新
export const PUT = withAuth(async ({ user, request }) => {
  const { settings } = await request.json()

  if (!Array.isArray(settings)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'settingsは配列で指定してください' },
      { status: 400 }
    )
  }

  if (settings.length !== STOCK_LINK_COUNT) {
    return NextResponse.json(
      { error: 'Bad Request', message: `settingsは${STOCK_LINK_COUNT}個で指定してください` },
      { status: 400 }
    )
  }

  // 各設定のバリデーション
  const seenKeys = new Set<string>()
  const seenOrders = new Set<number>()

  for (const setting of settings) {
    if (!setting || typeof setting !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request', message: '無効な設定です' },
        { status: 400 }
      )
    }

    const { key, visible, order } = setting

    if (!VALID_STOCK_LINK_KEYS.includes(key)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `無効なキー: ${key}` },
        { status: 400 }
      )
    }

    if (seenKeys.has(key)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `重複するキー: ${key}` },
        { status: 400 }
      )
    }
    seenKeys.add(key)

    if (typeof visible !== 'boolean') {
      return NextResponse.json(
        { error: 'Bad Request', message: 'visibleはboolean型で指定してください' },
        { status: 400 }
      )
    }

    if (typeof order !== 'number' || !Number.isInteger(order) || order < 0 || order >= STOCK_LINK_COUNT) {
      return NextResponse.json(
        { error: 'Bad Request', message: `無効なorder: ${order}` },
        { status: 400 }
      )
    }

    if (seenOrders.has(order)) {
      return NextResponse.json(
        { error: 'Bad Request', message: `重複するorder: ${order}` },
        { status: 400 }
      )
    }
    seenOrders.add(order)
  }

  // Upsert
  const sanitized = settings.map((s: { key: string; visible: boolean; order: number }) => ({
    key: s.key,
    visible: s.visible,
    order: s.order,
  }))

  const result = await prisma.userStockLinkSetting.upsert({
    where: { userId: user.id },
    create: { userId: user.id, settings: sanitized },
    update: { settings: sanitized },
    select: { settings: true },
  })

  return NextResponse.json({ success: true, data: result.settings })
}, '銘柄リンク設定の更新')
