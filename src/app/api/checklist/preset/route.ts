import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { CHECKLIST_PRESETS } from '@/lib/checklistPresets'

/** POST: プリセット一括登録 */
export const POST = withAuth(async ({ user }) => {
  // 既に項目がある場合は拒否
  const count = await prisma.userChecklist.count({ where: { userId: user.id } })
  if (count > 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: '既にチェックリスト項目が存在します' },
      { status: 400 }
    )
  }

  // プリセットを一括登録
  await prisma.userChecklist.createMany({
    data: CHECKLIST_PRESETS.map((label, index) => ({
      userId: user.id,
      label,
      order: index,
    })),
  })

  // 登録したデータを返す
  const items = await prisma.userChecklist.findMany({
    where: { userId: user.id },
    orderBy: { order: 'asc' },
  })

  return NextResponse.json({
    success: true,
    data: {
      items: items.map(item => ({
        id: item.id,
        label: item.label,
        order: item.order,
        checked: false,
      })),
      totalCount: items.length,
      checkedCount: 0,
      allCompleted: false,
    },
  })
}, 'プリセット登録')
