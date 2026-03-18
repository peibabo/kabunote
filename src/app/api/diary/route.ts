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

/** URL簡易バリデーション */
function isValidUrl(s: string): boolean {
  return /^https?:\/\/.+/.test(s)
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
      include: {
        newsItems: { orderBy: { order: 'asc' } },
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
          newsItems: [],
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
        newsItems: diary.newsItems.map(item => ({
          id: item.id,
          url: item.url,
          comment: item.comment,
        })),
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
    newsItems?: { url: string; comment?: string }[]
    reflection?: string
    tomorrowFocus?: string
  }

  if (!body.date || !isValidDate(body.date)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '日付形式が不正です（YYYY-MM-DD）' },
      { status: 400 }
    )
  }

  // テキストセクション2000文字制限
  const textFields = ['marketOverview', 'newsMemo', 'reflection', 'tomorrowFocus'] as const
  for (const field of textFields) {
    if (body[field] && body[field]!.length > 2000) {
      return NextResponse.json(
        { error: 'Bad Request', message: `${field}は2000文字以内で入力してください` },
        { status: 400 }
      )
    }
  }

  // newsItemsバリデーション
  const newsItems = body.newsItems ?? []
  if (newsItems.length > 20) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'ニュースは最大20件までです' },
      { status: 400 }
    )
  }
  for (const item of newsItems) {
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

  const diaryDate = new Date(body.date)
  const data = {
    marketOverview: body.marketOverview ?? '',
    newsMemo: body.newsMemo ?? '',
    reflection: body.reflection ?? '',
    tomorrowFocus: body.tomorrowFocus ?? '',
  }

  // トランザクションで日記upsert + newsItems一括更新
  const diary = await prisma.$transaction(async (tx) => {
    const d = await tx.investmentDiary.upsert({
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

    // 既存newsItemsを削除して再作成
    await tx.diaryNewsItem.deleteMany({ where: { diaryId: d.id } })
    if (newsItems.length > 0) {
      await tx.diaryNewsItem.createMany({
        data: newsItems.map((item, i) => ({
          diaryId: d.id,
          userId: user.id,
          url: item.url,
          comment: item.comment ?? '',
          order: i,
        })),
      })
    }

    return d
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
