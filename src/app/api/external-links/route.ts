import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import {
  isValidExternalLinkUrl,
  isValidExternalLinkLabel,
  isValidExternalLinkIcon,
  isValidExternalLinksCount,
} from '@/lib/validation'
import { GRADIENT_PRESETS } from '@/lib/defaultExternalLinks'

const validGradients = GRADIENT_PRESETS.map(p => p.value)

// GET: ユーザーの外部リンク一覧取得
export const GET = withAuth(async ({ user }) => {
  const links = await prisma.userExternalLink.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
    select: { id: true, url: true, label: true, icon: true, gradient: true, order: true },
  })

  // 未設定の場合はnullを返し、フロントでデフォルトを使用
  if (links.length === 0) {
    return NextResponse.json({ success: true, data: null })
  }

  return NextResponse.json({ success: true, data: links })
}, '外部リンクの取得')

// PUT: 外部リンク一覧を一括更新
export const PUT = withAuth(async ({ user, request }) => {
  const { links } = await request.json()

  if (!Array.isArray(links)) {
    return NextResponse.json({ error: 'Bad Request', message: 'linksは配列で指定してください' }, { status: 400 })
  }

  if (!isValidExternalLinksCount(links.length)) {
    return NextResponse.json({ error: 'Bad Request', message: '外部リンクは最大8個までです' }, { status: 400 })
  }

  // 各リンクのバリデーション
  for (const link of links) {
    if (!isValidExternalLinkUrl(link.url)) {
      return NextResponse.json({ error: 'Bad Request', message: `無効なURL: ${link.url}` }, { status: 400 })
    }
    if (!isValidExternalLinkLabel(link.label)) {
      return NextResponse.json({ error: 'Bad Request', message: `無効なラベル: ${link.label}` }, { status: 400 })
    }
    if (!isValidExternalLinkIcon(link.icon)) {
      return NextResponse.json({ error: 'Bad Request', message: '無効なアイコンです' }, { status: 400 })
    }
    if (!validGradients.includes(link.gradient)) {
      return NextResponse.json({ error: 'Bad Request', message: '無効なグラデーションです' }, { status: 400 })
    }
  }

  // トランザクション内で全削除→全挿入
  const result = await prisma.$transaction(async (tx) => {
    await tx.userExternalLink.deleteMany({ where: { userId: user.id } })

    if (links.length === 0) return []

    await tx.userExternalLink.createMany({
      data: links.map((link: { url: string; label: string; icon: string; gradient: string }, index: number) => ({
        userId: user.id,
        url: link.url,
        label: link.label,
        icon: link.icon,
        gradient: link.gradient,
        order: index,
      })),
    })

    return tx.userExternalLink.findMany({
      where: { userId: user.id },
      orderBy: { order: 'asc' },
      select: { id: true, url: true, label: true, icon: true, gradient: true, order: true },
    })
  })

  return NextResponse.json({ success: true, data: result })
}, '外部リンクの更新')
