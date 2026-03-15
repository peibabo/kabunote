import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { calculateStreak } from '@/lib/checklistCalc'
import { CHECKLIST_ITEMS } from '@/types/checklist'

const MAX_INDEX = CHECKLIST_ITEMS.length - 1

function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date)
}

function isValidCheckedItems(items: unknown): items is number[] {
  if (!Array.isArray(items)) return false
  const seen = new Set<number>()
  for (const item of items) {
    if (typeof item !== 'number' || !Number.isInteger(item) || item < 0 || item > MAX_INDEX) {
      return false
    }
    if (seen.has(item)) return false
    seen.add(item)
  }
  return true
}

// GET: 今日のチェックリストとストリーク情報を取得
export const GET = withAuth(async ({ user }) => {
  const records = await prisma.dailyChecklist.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 90,
    select: { date: true, checkedItems: true },
  })

  const today = records.length > 0 ? undefined : undefined // just fetch
  const todayRecord = records.find(r => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    return r.date === todayStr
  })

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const streak = calculateStreak(
    records.map(r => ({ date: r.date, checkedItems: r.checkedItems })),
    todayStr
  )

  return NextResponse.json({
    today: {
      date: todayStr,
      checkedItems: todayRecord?.checkedItems ?? [],
    },
    streak,
  })
}, 'チェックリストの取得')

// PUT: チェックリストを更新
export const PUT = withAuth(async ({ user, request }) => {
  const { date, checkedItems } = await request.json()

  if (!date || !isValidDate(date)) {
    return NextResponse.json({ error: '有効な日付を指定してください（YYYY-MM-DD）' }, { status: 400 })
  }

  if (!isValidCheckedItems(checkedItems)) {
    return NextResponse.json({ error: `checkedItemsは0-${MAX_INDEX}の整数配列で重複なしにしてください` }, { status: 400 })
  }

  await prisma.dailyChecklist.upsert({
    where: {
      userId_date: { userId: user.id, date },
    },
    update: { checkedItems },
    create: {
      userId: user.id,
      date,
      checkedItems,
    },
  })

  // ストリーク再計算
  const records = await prisma.dailyChecklist.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 90,
    select: { date: true, checkedItems: true },
  })

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const streak = calculateStreak(
    records.map(r => ({ date: r.date, checkedItems: r.checkedItems })),
    todayStr
  )

  return NextResponse.json({
    today: { date, checkedItems },
    streak,
  })
}, 'チェックリストの更新')
