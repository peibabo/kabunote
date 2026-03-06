import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

// GET: タグ一覧取得
export const GET = withStock(async ({ stockId }) => {
  const tags = await prisma.stockTag.findMany({
    where: { stockId },
    orderBy: { createdAt: 'asc' }
  })

  return NextResponse.json({
    success: true,
    data: tags.map(t => ({
      id: t.id,
      label: t.name,
      color: t.color,
      createdAt: t.createdAt.toISOString(),
    }))
  })
}, 'タグの取得')

// POST: タグ追加
export const POST = withStock(async ({ stockId, request }) => {
  const body = await request.json()
  const { label, color } = body

  if (!label || typeof label !== 'string' || !label.trim()) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'label は必須です' },
      { status: 400 }
    )
  }

  const tag = await prisma.stockTag.upsert({
    where: { stockId_name: { stockId, name: label.trim() } },
    update: { color: color ?? 'blue' },
    create: { stockId, name: label.trim(), color: color ?? 'blue' }
  })

  return NextResponse.json({
    success: true,
    data: {
      id: tag.id,
      label: tag.name,
      color: tag.color,
      createdAt: tag.createdAt.toISOString(),
    }
  })
}, 'タグの追加')
