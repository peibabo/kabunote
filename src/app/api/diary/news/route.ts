import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/** 日記ニュースを取得してフォーマット */
async function fetchDiaryNews(userId: string, limit: number, skip: number) {
  const [items, total] = await Promise.all([
    prisma.diaryNewsItem.findMany({
      where: { userId },
      include: { diary: { select: { diaryDate: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.diaryNewsItem.count({ where: { userId } }),
  ])
  return {
    items: items.map(item => ({
      id: item.id,
      url: item.url,
      comment: item.comment,
      diaryDate: item.diary.diaryDate.toISOString().slice(0, 10),
      createdAt: item.createdAt.toISOString(),
      source: 'diary' as const,
    })),
    total,
  }
}

/** 銘柄ニュースを取得してフォーマット */
async function fetchStockNews(userId: string, limit: number, skip: number) {
  const [items, total] = await Promise.all([
    prisma.stockNewsItem.findMany({
      where: { userId },
      include: { stock: { select: { symbol: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.stockNewsItem.count({ where: { userId } }),
  ])
  return {
    items: items.map(item => ({
      id: item.id,
      url: item.url,
      comment: item.comment,
      symbol: item.stock.symbol,
      stockName: item.stock.name,
      createdAt: item.createdAt.toISOString(),
      source: 'stock' as const,
    })),
    total,
  }
}

/** GET: ニュース一覧（全日付横断、新しい順） */
/** source=all: 日記+銘柄、source=diary: 日記のみ、source=stock: 銘柄のみ */
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
  const source = url.searchParams.get('source') ?? 'all'

  if (source === 'diary') {
    const result = await fetchDiaryNews(user.id, limit, offset)
    return NextResponse.json({ success: true, data: result })
  }

  if (source === 'stock') {
    const result = await fetchStockNews(user.id, limit, offset)
    return NextResponse.json({ success: true, data: result })
  }

  // source === 'all': 両方取得してマージ
  const [diary, stock] = await Promise.all([
    fetchDiaryNews(user.id, limit, 0),
    fetchStockNews(user.id, limit, 0),
  ])

  const merged = [...diary.items, ...stock.items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit)

  return NextResponse.json({
    success: true,
    data: {
      items: merged,
      total: diary.total + stock.total,
    },
  })
}, 'ニュース一覧取得')
