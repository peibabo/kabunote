import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  // 認証成功時、単純にホームページにリダイレクト
  // セッション処理はクライアントサイドで行う
  return NextResponse.redirect(`${requestUrl.origin}/auth/success`)
}