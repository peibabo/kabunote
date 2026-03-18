import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

/** URL簡易バリデーション */
function isValidUrl(s: string): boolean {
  return /^https?:\/\/.+/.test(s)
}

const options = { createIfNotFound: true }

// GET: 銘柄ニュース取得
export const GET = withStock(async ({ stockId }) => {
  const items = await prisma.stockNewsItem.findMany({
    where: { stockId },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({
    success: true,
    data: {
      items: items.map(item => ({
        id: item.id,
        url: item.url,
        comment: item.comment,
      })),
    },
  })
}, '銘柄ニュース取得', options)

// PUT: 銘柄ニュース一括更新
export const PUT = withStock(async ({ stockId, user, request }) => {
  const { newsItems } = await request.json() as {
    newsItems?: { url: string; comment?: string }[]
  }

  const items = newsItems ?? []

  // バリデーション
  if (items.length > 20) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'ニュースは最大20件までです' },
      { status: 400 }
    )
  }
  for (const item of items) {
    if (!item.url || !isValidUrl(item.url)) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'URLはhttp://またはhttps://で始まる必要があります' },
        { status: 400 }
      )
    }
    if (item.url.length > 2000) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'URLは2000文字以内で入力してください' },
        { status: 400 }
      )
    }
    if (item.comment && item.comment.length > 500) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'コメントは500文字以内で入力してください' },
        { status: 400 }
      )
    }
  }

  // トランザクションで全件削除→再作成
  await prisma.$transaction(async (tx) => {
    await tx.stockNewsItem.deleteMany({ where: { stockId } })
    if (items.length > 0) {
      await tx.stockNewsItem.createMany({
        data: items.map((item, i) => ({
          stockId,
          userId: user.id,
          url: item.url,
          comment: item.comment ?? '',
          order: i,
        })),
      })
    }
  })

  return NextResponse.json({
    success: true,
    data: { updatedAt: new Date().toISOString() },
  })
}, '銘柄ニュース更新', options)
