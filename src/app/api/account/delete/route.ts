import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth } from '@/lib/apiHandler'
import { prisma } from '@/lib/prisma'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const DELETE = withAuth(async ({ user }) => {
  // Prisma: CASCADE削除で全関連データを削除
  await prisma.user.delete({
    where: { id: user.id },
  })

  // Supabase Auth: ユーザー削除（失敗しても致命的ではない）
  try {
    await supabaseAdmin.auth.admin.deleteUser(user.id)
  } catch (authError) {
    console.warn('⚠️ Supabase Authユーザー削除失敗（DBデータは削除済み）:', authError)
  }

  return NextResponse.json({ message: 'アカウントを削除しました' })
}, 'アカウント削除')
