import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/apiHandler'
import { AUTH_LIMIT } from '@/lib/rateLimit'

export const POST = withAuth(async ({ user, request }) => {
  const body = await request.json()
  const { id, name, picture, email, authProvider } = body

  // セッションのユーザーIDが一致することを確認
  if (user.id !== id) {
    return NextResponse.json({ error: '不正なユーザーです' }, { status: 403 })
  }

  const result = await prisma.user.upsert({
    where: { id },
    create: { id, email, name, picture, authProvider },
    update: { name, picture },
  })

  return NextResponse.json(result)
}, 'ユーザー同期', { rateLimit: AUTH_LIMIT })
