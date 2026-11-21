import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { WRITE_LIMIT } from '@/lib/rateLimit'
import { isValidOnboardingEvent } from '@/lib/onboardingEvents'

// POST: オンボーディングのステップ通過・完了/スキップを記録
export const POST = withAuth(async ({ user, request }) => {
  const { event, step } = await request.json()

  if (!isValidOnboardingEvent(event, step)) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'event または step が不正です' },
      { status: 400 }
    )
  }

  // 初回ログイン直後はウィザード表示が sync-user より先に走り、
  // app_users が未作成のことがある（外部キー制約対策）
  await prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: {
      id: user.id,
      email: user.email || `temp_${user.id}@example.com`,
      authProvider: 'unknown',
    },
  })

  await prisma.onboardingEvent.create({
    data: { userId: user.id, event, step },
  })

  return NextResponse.json({ success: true })
}, 'オンボーディング計測の記録', { rateLimit: WRITE_LIMIT })
