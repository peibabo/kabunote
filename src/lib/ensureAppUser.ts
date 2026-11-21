import { prisma } from '@/lib/prisma'

/**
 * app_users にログインユーザーの行があることを保証する（外部キー制約対策）
 *
 * 初回ログイン直後は、クライアントの /api/auth/sync-user が終わる前に
 * ダッシュボードの各ウィジェットが書き込みAPIを呼ぶことがある。
 * withAuth から全APIで呼び、どの順番で届いても外部キー違反にならないようにする。
 *
 * INSERT ... ON CONFLICT DO NOTHING なので既存ユーザーの値は変えない。
 * 名前・アイコンは従来どおり sync-user が更新する。
 * 同じインスタンスで一度確認したユーザーはDBに問い合わせない。
 */
const MAX_CACHE_SIZE = 10_000
const ensuredUserIds = new Set<string>()

interface AuthUserLike {
  id: string
  email?: string
  app_metadata?: { provider?: string }
}

export async function ensureAppUser(user: AuthUserLike): Promise<void> {
  if (ensuredUserIds.has(user.id)) return

  await prisma.user.createMany({
    data: [{
      id: user.id,
      email: user.email || `temp_${user.id}@example.com`,
      authProvider: user.app_metadata?.provider || 'unknown',
    }],
    skipDuplicates: true,
  })

  if (ensuredUserIds.size >= MAX_CACHE_SIZE) ensuredUserIds.clear()
  ensuredUserIds.add(user.id)
}

/** アカウント削除時など、確認済みキャッシュから外す */
export function forgetAppUser(userId: string): void {
  ensuredUserIds.delete(userId)
}

/** テスト用 */
export function resetEnsuredAppUsers(): void {
  ensuredUserIds.clear()
}
