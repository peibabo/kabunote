import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/** GET: ニュース一覧（全日付横断、新しい順） */
/** source=all: 日記+銘柄、source=diary: 日記のみ、source=stock: 銘柄のみ */
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)
  const source = url.searchParams.get('source') ?? 'all'

  const includeDiary = source === 'all' || source === 'diary'
  const includeStock = source === 'all' || source === 'stock'

  // 日記ニュース取得
  const diaryPromise = includeDiary
    ? Promise.all([
        prisma.diaryNewsItem.findMany({
          where: { userId: user.id },
          include: { diary: { select: { diaryDate: true } } },
          orderBy: { createdAt: 'desc' },
          take: source === 'all' ? limit : limit,
          skip: source === 'all' ? 0 : offset,
        }),
        prisma.diaryNewsItem.count({ where: { userId: user.id } }),
      ])
    : Promise.resolve([[] as Awaited<ReturnType<typeof prisma.diaryNewsItem.findMany>>, 0] as const)

  // 銘柄ニュース取得
  const stockPromise = includeStock
    ? Promise.all([
        prisma.stockNewsItem.findMany({
          where: { userId: user.id },
          include: { stock: { select: { symbol: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: source === 'all' ? limit : limit,
          skip: source === 'all' ? 0 : offset,
        }),
        prisma.stockNewsItem.count({ where: { userId: user.id } }),
      ])
    : Promise.resolve([[] as Awaited<ReturnType<typeof prisma.stockNewsItem.findMany>>, 0] as const)

  const [[diaryItems, diaryTotal], [stockItems, stockTotal]] = await Promise.all([diaryPromise, stockPromise])

  if (source === 'diary') {
    return NextResponse.json({
      success: true,
      data: {
        items: diaryItems.map(item => ({
          id: item.id,
          url: item.url,
          comment: item.comment,
          diaryDate: item.diary.diaryDate.toISOString().slice(0, 10),
          createdAt: item.createdAt.toISOString(),
          source: 'diary' as const,
        })),
        total: diaryTotal,
      },
    })
  }

  if (source === 'stock') {
    return NextResponse.json({
      success: true,
      data: {
        items: stockItems.map(item => ({
          id: item.id,
          url: item.url,
          comment: item.comment,
          symbol: item.stock.symbol,
          stockName: item.stock.name,
          createdAt: item.createdAt.toISOString(),
          source: 'stock' as const,
        })),
        total: stockTotal,
      },
    })
  }

  // source === 'all': 両方マージしてcreatedAt順
  type MergedItem = {
    id: string
    url: string
    comment: string
    createdAt: string
    source: 'diary' | 'stock'
    diaryDate?: string
    symbol?: string
    stockName?: string | null
  }

  const merged: MergedItem[] = [
    ...diaryItems.map(item => ({
      id: item.id,
      url: item.url,
      comment: item.comment,
      diaryDate: item.diary.diaryDate.toISOString().slice(0, 10),
      createdAt: item.createdAt.toISOString(),
      source: 'diary' as const,
    })),
    ...stockItems.map(item => ({
      id: item.id,
      url: item.url,
      comment: item.comment,
      symbol: item.stock.symbol,
      stockName: item.stock.name,
      createdAt: item.createdAt.toISOString(),
      source: 'stock' as const,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(offset, offset + limit)

  return NextResponse.json({
    success: true,
    data: {
      items: merged,
      total: diaryTotal + stockTotal,
    },
  })
}, 'ニュース一覧取得')
