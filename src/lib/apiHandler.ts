import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { resolveStockId } from '@/lib/resolveStockId'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteParams = Record<string, any>

interface AuthContext {
  user: User
  request: NextRequest
  params: RouteParams
}

interface StockContext extends AuthContext {
  stockId: string
}

type AuthHandler = (ctx: AuthContext) => Promise<NextResponse>
type StockHandler = (ctx: StockContext) => Promise<NextResponse>

interface StockOptions {
  createIfNotFound?: boolean
}

async function authenticate(): Promise<{ user: User } | NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '認証が必要です' },
      { status: 401 }
    )
  }
  return { user }
}

export function withAuth(handler: AuthHandler, errorLabel: string) {
  return async (request: NextRequest, context?: { params?: Promise<RouteParams> }) => {
    try {
      const auth = await authenticate()
      if (auth instanceof NextResponse) return auth

      const params = context?.params ? await context.params : {}
      return await handler({ user: auth.user, request, params })
    } catch (error) {
      Sentry.captureException(error)
      console.error(`❌ ${errorLabel}エラー:`, error)
      return NextResponse.json(
        { error: 'Internal Server Error', message: `${errorLabel}に失敗しました` },
        { status: 500 }
      )
    }
  }
}

export function withStock(handler: StockHandler, errorLabel: string, options?: StockOptions) {
  return withAuth(async (ctx) => {
    const rawStockId = ctx.params.stockId
    const stockId = await resolveStockId(rawStockId, ctx.user.id, options?.createIfNotFound)
    if (!stockId) {
      return NextResponse.json(
        { error: 'Not Found', message: '銘柄が見つかりません' },
        { status: 404 }
      )
    }
    return await handler({ ...ctx, stockId })
  }, errorLabel)
}
