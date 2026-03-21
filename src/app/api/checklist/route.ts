import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { MAX_CHECKLIST_ITEMS } from '@/lib/checklistPresets'
import { getTodayJST, dateStrToUTCMidnight } from '@/lib/dateJst'

/** GET: チェックリスト項目一覧 + 今日のチェック状態 */
export const GET = withAuth(async ({ user }) => {
  const today = getTodayJST()

  const items = await prisma.userChecklist.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
    include: {
      checks: {
        where: { checkedDate: dateStrToUTCMidnight(today) },
        take: 1,
      },
    },
  })

  const result = items.map(item => ({
    id: item.id,
    label: item.label,
    order: item.order,
    checked: item.checks.length > 0,
  }))

  const checkedCount = result.filter(i => i.checked).length

  return NextResponse.json({
    success: true,
    data: {
      items: result,
      totalCount: result.length,
      checkedCount,
      allCompleted: result.length > 0 && checkedCount === result.length,
    },
  })
}, 'チェックリスト取得')

/** POST: 項目追加 */
export const POST = withAuth(async ({ user, request }) => {
  const { label } = await request.json() as { label: string }

  if (!label || typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: '項目名を入力してください' },
      { status: 400 }
    )
  }

  if (label.trim().length > 100) {
    return NextResponse.json(
      { error: 'Bad Request', message: '項目名は100文字以内で入力してください' },
      { status: 400 }
    )
  }

  // 上限チェック
  const count = await prisma.userChecklist.count({ where: { userId: user.id } })
  if (count >= MAX_CHECKLIST_ITEMS) {
    return NextResponse.json(
      { error: 'Bad Request', message: `チェックリストは最大${MAX_CHECKLIST_ITEMS}項目までです` },
      { status: 400 }
    )
  }

  const item = await prisma.userChecklist.create({
    data: {
      userId: user.id,
      label: label.trim(),
      order: count,
    },
  })

  return NextResponse.json({
    success: true,
    data: { id: item.id, label: item.label, order: item.order, checked: false },
  })
}, 'チェックリスト項目追加')

/** PUT: 項目一括更新（並び替え・テキスト編集） */
export const PUT = withAuth(async ({ user, request }) => {
  const { items } = await request.json() as {
    items: { id: string; label: string; order: number }[]
  }

  if (!Array.isArray(items)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '無効なリクエストです' },
      { status: 400 }
    )
  }

  // 全項目がこのユーザーのものか確認
  const existingItems = await prisma.userChecklist.findMany({
    where: { userId: user.id },
    select: { id: true },
  })
  const existingIds = new Set(existingItems.map(i => i.id))
  const allValid = items.every(i => existingIds.has(i.id))
  if (!allValid) {
    return NextResponse.json(
      { error: 'Forbidden', message: '不正な項目が含まれています' },
      { status: 403 }
    )
  }

  // 一括更新
  await Promise.all(
    items.map(item =>
      prisma.userChecklist.update({
        where: { id: item.id },
        data: { label: item.label.trim(), order: item.order },
      })
    )
  )

  return NextResponse.json({ success: true })
}, 'チェックリスト一括更新')
