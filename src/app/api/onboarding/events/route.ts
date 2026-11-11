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

  await prisma.onboardingEvent.create({
    data: { userId: user.id, event, step },
  })

  return NextResponse.json({ success: true })
}, 'オンボーディング計測の記録', { rateLimit: WRITE_LIMIT })
