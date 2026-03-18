import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/** GET: ニュース一覧（全日付横断、新しい順） */
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') ?? '0', 10)

  const [items, total] = await Promise.all([
    prisma.diaryNewsItem.findMany({
      where: { userId: user.id },
      include: { diary: { select: { diaryDate: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.diaryNewsItem.count({ where: { userId: user.id } }),
  ])

  return NextResponse.json({
    success: true,
    data: {
      items: items.map(item => ({
        id: item.id,
        url: item.url,
        comment: item.comment,
        diaryDate: item.diary.diaryDate.toISOString().slice(0, 10),
        createdAt: item.createdAt.toISOString(),
      })),
      total,
    },
  })
}, 'ニュース一覧取得')
