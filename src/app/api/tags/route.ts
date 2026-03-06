import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

// GET: ユーザーの全銘柄にまたがるタグ一覧を取得（使用頻度順）
export const GET = withAuth(async ({ user }) => {
  const tags = await prisma.stockTag.findMany({
    where: { stock: { userId: user.id } },
    select: { name: true, color: true }
  })

  const countMap = new Map<string, { label: string; color: string; count: number }>()
  for (const tag of tags) {
    const key = `${tag.name}::${tag.color}`
    const existing = countMap.get(key)
    if (existing) {
      existing.count++
    } else {
      countMap.set(key, { label: tag.name, color: tag.color, count: 1 })
    }
  }

  const result = Array.from(countMap.values()).sort((a, b) => b.count - a.count)

  return NextResponse.json({ success: true, data: result })
}, '全タグの取得')

// PUT: タグ名・色を全銘柄にまたがって一括変更
export const PUT = withAuth(async ({ user, request }) => {
  const body = await request.json()
  const { oldLabel, newLabel, newColor } = body

  if (!oldLabel || !newLabel || !newColor) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'oldLabel, newLabel, newColor は必須です' },
      { status: 400 }
    )
  }

  await prisma.stockTag.updateMany({
    where: { name: oldLabel, stock: { userId: user.id } },
    data: { name: newLabel, color: newColor }
  })

  return NextResponse.json({ success: true })
}, 'タグの更新')

// DELETE: タグを全銘柄にまたがって一括削除
export const DELETE = withAuth(async ({ user, request }) => {
  const body = await request.json()
  const { label } = body

  if (!label) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'label は必須です' },
      { status: 400 }
    )
  }

  await prisma.stockTag.deleteMany({
    where: { name: label, stock: { userId: user.id } }
  })

  return NextResponse.json({ success: true })
}, 'タグの削除')
