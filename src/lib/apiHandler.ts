import * as Sentry from '@sentry/nextjs'
import { NextRequest, NextResponse } from 'next/server'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { resolveStockId } from '@/lib/resolveStockId'
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit'
import type { RateLimitConfig } from '@/lib/rateLimit'

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

interface AuthOptions {
  /** カスタムレート制限設定 */
  rateLimit?: RateLimitConfig
}

interface StockOptions extends AuthOptions {
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

export function withAuth(handler: AuthHandler, errorLabel: string, options?: AuthOptions) {
  return async (request: NextRequest, context?: { params?: Promise<RouteParams> }) => {
    try {
      const auth = await authenticate()
      if (auth instanceof NextResponse) return auth

      // レート制限チェック（ユーザーID × エンドポイント単位）
      const rateLimitKey = `user:${auth.user.id}:${errorLabel}`
      const result = checkRateLimit(rateLimitKey, options?.rateLimit)
      const headers = rateLimitHeaders(result, options?.rateLimit)

      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too Many Requests', message: 'リクエスト数が上限に達しました。しばらくしてから再度お試しください。' },
          { status: 429, headers: { ...headers, 'Retry-After': String(result.resetInSeconds) } }
        )
      }

      const params = context?.params ? await context.params : {}
      const response = await handler({ user: auth.user, request, params })

      // レート制限ヘッダーをレスポンスに付与
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response
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

// Decimal型をnumber | nullに変換するヘルパー
export function toNumber(value: unknown): number | null {
  return value != null ? Number(value) : null
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
  }, errorLabel, options)
}
