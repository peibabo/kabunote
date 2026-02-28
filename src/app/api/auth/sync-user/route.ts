import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, email, name, picture, authProvider } = body

    // Supabase認証状態を確認
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    // セッションのユーザーIDが一致することを確認
    if (session.user.id !== id) {
      return NextResponse.json({ error: '不正なユーザーです' }, { status: 403 })
    }

    // データベースでユーザーをupsert（存在しなければ作成、存在すれば更新）
    const user = await prisma.user.upsert({
      where: { id },
      create: {
        id,
        email,
        name,
        picture,
        authProvider,
      },
      update: {
        name,
        picture,
        // emailとauthProviderは初回作成時のみ設定、更新時は変更しない
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('ユーザー同期エラー:', error)
    return NextResponse.json(
      { error: 'ユーザー同期に失敗しました' },
      { status: 500 }
    )
  }
}