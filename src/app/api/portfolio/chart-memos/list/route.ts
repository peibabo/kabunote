import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { VALID_CHART_TYPES } from '@/types/portfolio'

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 50

// GET: チャートメモ一覧取得（ページネーション対応）
export const GET = withAuth(async ({ user, request }) => {
  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || DEFAULT_LIMIT, MAX_LIMIT)
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)
  const chartType = url.searchParams.get('chartType') || 'all'

  const where: { userId: string; chartType?: string } = {
    userId: user.id,
  }

  if (chartType !== 'all' && VALID_CHART_TYPES.includes(chartType as never)) {
    where.chartType = chartType
  }

  const [memos, total] = await Promise.all([
    prisma.chartMemo.findMany({
      where,
      orderBy: { snapshotDate: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.chartMemo.count({ where }),
  ])

  const items = memos.map(m => ({
    id: m.id,
    snapshotDate: m.snapshotDate.toISOString().split('T')[0],
    chartType: m.chartType,
    symbol: m.symbol,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }))

  return NextResponse.json({ success: true, data: { items, total } })
}, 'チャートメモ一覧の取得')
