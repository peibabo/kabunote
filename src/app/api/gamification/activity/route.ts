import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'

export const GET = withAuth(async ({ user }) => {
  const logs = await prisma.xpActivityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      actionType: true,
      xpEarned: true,
      description: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ success: true, data: logs })
}, 'アクティビティログ取得')
