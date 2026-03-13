import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { FEEDBACK_LIMIT } from '@/lib/rateLimit'
import { notifyFeedback } from '@/lib/slack'

const VALID_CATEGORIES = ['FEATURE_REQUEST', 'IMPROVEMENT', 'BUG_REPORT', 'OTHER'] as const

export const POST = withAuth(async ({ user, request }) => {
  const { category, content } = await request.json()

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'カテゴリを選択してください' },
      { status: 400 }
    )
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json(
      { error: 'Bad Request', message: '内容を入力してください' },
      { status: 400 }
    )
  }

  if (content.length > 1000) {
    return NextResponse.json(
      { error: 'Bad Request', message: '内容は1000文字以内で入力してください' },
      { status: 400 }
    )
  }

  await prisma.feedback.create({
    data: {
      userId: user.id,
      category,
      content: content.trim(),
    },
  })

  notifyFeedback(category, content.trim())

  return NextResponse.json({ success: true })
}, 'フィードバックの送信', { rateLimit: FEEDBACK_LIMIT })
