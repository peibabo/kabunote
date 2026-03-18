import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

/** 日付文字列のバリデーション (YYYY-MM-DD) */
function isValidDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s).getTime())
}

/** 月文字列のバリデーション (YYYY-MM) */
function isValidMonth(s: string): boolean {
  return /^\d{4}-\d{2}$/.test(s)
}

/** GET: 日記取得（?date=YYYY-MM-DD）または月の日記日付リスト（?month=YYYY-MM） */
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const date = url.searchParams.get('date')
  const month = url.searchParams.get('month')

  // モード1: 特定日の日記取得
  if (date) {
    if (!isValidDate(date)) {
      return NextResponse.json(
        { error: 'Bad Request', message: '日付形式が不正です（YYYY-MM-DD）' },
        { status: 400 }
      )
    }

    const diary = await prisma.investmentDiary.findUnique({
      where: {
        userId_diaryDate: { userId: user.id, diaryDate: new Date(date) },
      },
    })

    if (!diary) {
      return NextResponse.json({
        success: true,
        data: {
          id: null,
          diaryDate: date,
          marketOverview: '',
          newsMemo: '',
          reflection: '',
          tomorrowFocus: '',
          updatedAt: null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: diary.id,
        diaryDate: diary.diaryDate.toISOString().slice(0, 10),
        marketOverview: diary.marketOverview,
        newsMemo: diary.newsMemo,
        reflection: diary.reflection,
        tomorrowFocus: diary.tomorrowFocus,
        updatedAt: diary.updatedAt.toISOString(),
      },
    })
  }

  // モード2: 月の日記日付リスト
  if (month) {
    if (!isValidMonth(month)) {
      return NextResponse.json(
        { error: 'Bad Request', message: '月形式が不正です（YYYY-MM）' },
        { status: 400 }
      )
    }

    const startDate = new Date(`${month}-01`)
    const year = startDate.getFullYear()
    const m = startDate.getMonth()
    const endDate = new Date(year, m + 1, 1)

    const diaries = await prisma.investmentDiary.findMany({
      where: {
        userId: user.id,
        diaryDate: { gte: startDate, lt: endDate },
      },
      select: { diaryDate: true },
      orderBy: { diaryDate: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        dates: diaries.map(d => d.diaryDate.toISOString().slice(0, 10)),
      },
    })
  }

  return NextResponse.json(
    { error: 'Bad Request', message: 'date または month パラメータが必要です' },
    { status: 400 }
  )
}, '投資日記取得')

/** PUT: 日記保存（upsert） */
export const PUT = withAuth(async ({ user, request }) => {
  const body = await request.json() as {
    date?: string
    marketOverview?: string
    newsMemo?: string
    reflection?: string
    tomorrowFocus?: string
  }

  if (!body.date || !isValidDate(body.date)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '日付形式が不正です（YYYY-MM-DD）' },
      { status: 400 }
    )
  }

  // 各セクション2000文字制限
  const fields = ['marketOverview', 'newsMemo', 'reflection', 'tomorrowFocus'] as const
  for (const field of fields) {
    if (body[field] && body[field]!.length > 2000) {
      return NextResponse.json(
        { error: 'Bad Request', message: `${field}は2000文字以内で入力してください` },
        { status: 400 }
      )
    }
  }

  const diaryDate = new Date(body.date)
  const data = {
    marketOverview: body.marketOverview ?? '',
    newsMemo: body.newsMemo ?? '',
    reflection: body.reflection ?? '',
    tomorrowFocus: body.tomorrowFocus ?? '',
  }

  const diary = await prisma.investmentDiary.upsert({
    where: {
      userId_diaryDate: { userId: user.id, diaryDate },
    },
    create: {
      userId: user.id,
      diaryDate,
      ...data,
    },
    update: data,
  })

  return NextResponse.json({
    success: true,
    data: {
      id: diary.id,
      diaryDate: diary.diaryDate.toISOString().slice(0, 10),
      updatedAt: diary.updatedAt.toISOString(),
    },
  })
}, '投資日記保存')
