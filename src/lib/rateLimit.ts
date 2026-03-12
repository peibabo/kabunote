/**
 * インメモリ スライディングウィンドウ レートリミッター
 *
 * ユーザーIDまたはIPアドレスごとにリクエスト数を制限する。
 * サーバーレス環境（Vercel等）ではインスタンス間で状態共有されないが、
 * 単一インスタンス内での過剰リクエスト防止には十分効果的。
 */

interface RateLimitEntry {
  timestamps: number[]
}

export interface RateLimitConfig {
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number
}

interface RateLimitResult {
  allowed: boolean
  /** 残りリクエスト数 */
  remaining: number
  /** リセットまでの秒数 */
  resetInSeconds: number
}

/** デフォルト設定: 1分間に60リクエスト */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60 * 1000,
}

/** 書き込み系エンドポイント用: 1分間に30リクエスト */
export const WRITE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60 * 1000,
}

/** 認証系エンドポイント用: 1分間に10リクエスト */
export const AUTH_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000,
}

/** フィードバック用: 1時間に5リクエスト */
export const FEEDBACK_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
}

// インメモリストア
const store = new Map<string, RateLimitEntry>()

// 古いエントリを定期的にクリーンアップ（メモリリーク防止）
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5分
let lastCleanup = Date.now()

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store.entries()) {
    // 最も新しいタイムスタンプが10分以上前なら削除
    if (entry.timestamps.length === 0 || now - entry.timestamps[entry.timestamps.length - 1] > 10 * 60 * 1000) {
      store.delete(key)
    }
  }
}

/**
 * レート制限チェック
 * @param key - 識別キー（ユーザーID or IPアドレス）
 * @param config - レート制限設定
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now()
  cleanup(now)

  const windowStart = now - config.windowMs
  const entry = store.get(key)

  if (!entry) {
    store.set(key, { timestamps: [now] })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInSeconds: Math.ceil(config.windowMs / 1000),
    }
  }

  // ウィンドウ外のタイムスタンプを除去
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= config.maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const resetInSeconds = Math.ceil((oldestInWindow + config.windowMs - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetInSeconds: Math.ceil(config.windowMs / 1000),
  }
}

/**
 * レート制限ヘッダーを生成
 */
export function rateLimitHeaders(result: RateLimitResult, config: RateLimitConfig = DEFAULT_CONFIG): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetInSeconds),
  }
}

/** テスト用: ストアをリセット */
export function resetRateLimitStore(): void {
  store.clear()
  lastCleanup = Date.now()
}
