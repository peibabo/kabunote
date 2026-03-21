import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公開パス: そのまま通過
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/help')
  ) {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // LP (`/`): 認証済みなら /dashboard にリダイレクト
  if (pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return response
  }

  // /dashboard: 未認証なら /login にリダイレクト
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
