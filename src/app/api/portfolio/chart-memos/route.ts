import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { RANGE_DAYS } from '@/lib/snapshotCalc'
import { VALID_CHART_TYPES } from '@/types/portfolio'

const MAX_CONTENT_LENGTH = 50

// GET: チャートメモ一覧取得
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const range = url.searchParams.get('range') || '1M'
  const days = RANGE_DAYS[range] ?? 30

  const where: { userId: string; snapshotDate?: { gte: Date } } = {
    userId: user.id,
  }

  if (days > 0) {
    const since = new Date()
    since.setDate(since.getDate() - days)
    since.setHours(0, 0, 0, 0)
    where.snapshotDate = { gte: since }
  }

  const memos = await prisma.chartMemo.findMany({
    where,
    orderBy: { snapshotDate: 'asc' },
  })

  const data = memos.map(m => ({
    id: m.id,
    snapshotDate: m.snapshotDate.toISOString().split('T')[0],
    chartType: m.chartType,
    symbol: m.symbol,
    content: m.content,
  }))

  return NextResponse.json({ success: true, data })
}, 'チャートメモの取得')

// PUT: チャートメモ作成/更新
export const PUT = withAuth(async ({ user, request }) => {
  const body = await request.json()
  const { snapshotDate, chartType, symbol, content } = body

  // バリデーション
  if (!snapshotDate || typeof snapshotDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(snapshotDate)) {
    return NextResponse.json(
      { error: 'Bad Request', message: '日付の形式が不正です' },
      { status: 400 }
    )
  }

  if (!chartType || !VALID_CHART_TYPES.includes(chartType)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'グラフ種別が不正です' },
      { status: 400 }
    )
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'メモ内容を入力してください' },
      { status: 400 }
    )
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: 'Bad Request', message: `メモは${MAX_CONTENT_LENGTH}文字以内で入力してください` },
      { status: 400 }
    )
  }

  const symbolValue = symbol || ''
  const dateValue = new Date(snapshotDate + 'T00:00:00.000Z')

  const memo = await prisma.chartMemo.upsert({
    where: {
      userId_snapshotDate_chartType_symbol: {
        userId: user.id,
        snapshotDate: dateValue,
        chartType,
        symbol: symbolValue,
      },
    },
    update: { content: content.trim() },
    create: {
      userId: user.id,
      snapshotDate: dateValue,
      chartType,
      symbol: symbolValue,
      content: content.trim(),
    },
  })

  return NextResponse.json({
    success: true,
    data: {
      id: memo.id,
      snapshotDate: memo.snapshotDate.toISOString().split('T')[0],
      chartType: memo.chartType,
      symbol: memo.symbol,
      content: memo.content,
    },
  })
}, 'チャートメモの保存')

// DELETE: チャートメモ削除
export const DELETE = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const snapshotDate = url.searchParams.get('snapshotDate')
  const chartType = url.searchParams.get('chartType')
  const symbol = url.searchParams.get('symbol') || ''

  if (!snapshotDate || !chartType) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'パラメータが不足しています' },
      { status: 400 }
    )
  }

  const dateValue = new Date(snapshotDate + 'T00:00:00.000Z')

  await prisma.chartMemo.deleteMany({
    where: {
      userId: user.id,
      snapshotDate: dateValue,
      chartType,
      symbol,
    },
  })

  return NextResponse.json({ success: true })
}, 'チャートメモの削除')
