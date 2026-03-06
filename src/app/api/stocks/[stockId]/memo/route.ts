import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withStock } from '@/lib/apiHandler'

const memoOptions = { createIfNotFound: true }

// GET: 株ノオト取得
export const GET = withStock(async ({ stockId }) => {
  let memo = await prisma.stockMemo.findUnique({ where: { stockId } })

  if (!memo) {
    memo = await prisma.stockMemo.create({ data: { stockId, content: '' } })
  }

  return NextResponse.json({
    success: true,
    data: {
      id: memo.id,
      content: memo.content,
      updatedAt: memo.updatedAt.toISOString()
    }
  })
}, '株ノオトの取得', memoOptions)

// PUT: 株ノオト更新
export const PUT = withStock(async ({ stockId, request }) => {
  const { content } = await request.json()

  if (typeof content !== 'string') {
    return NextResponse.json(
      { error: 'Bad Request', message: 'contentは文字列である必要があります' },
      { status: 400 }
    )
  }

  let memo = await prisma.stockMemo.findUnique({ where: { stockId } })

  if (memo) {
    memo = await prisma.stockMemo.update({ where: { stockId }, data: { content } })
  } else {
    memo = await prisma.stockMemo.create({ data: { stockId, content } })
  }

  return NextResponse.json({
    success: true,
    data: {
      id: memo.id,
      content: memo.content,
      updatedAt: memo.updatedAt.toISOString()
    }
  })
}, '株ノオトの更新', memoOptions)

// DELETE: 株ノオト削除
export const DELETE = withStock(async ({ stockId }) => {
  try {
    await prisma.stockMemo.delete({ where: { stockId } })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ success: true, message: '株ノオトは既に削除されています' })
    }
    throw error
  }

  return NextResponse.json({ success: true, message: '株ノオトを削除しました' })
}, '株ノオトの削除', memoOptions)
