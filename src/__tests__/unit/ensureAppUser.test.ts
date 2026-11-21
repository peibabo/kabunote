import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { ensureAppUser, forgetAppUser, resetEnsuredAppUsers } from '@/lib/ensureAppUser'

beforeEach(() => {
  prismaMock.user.createMany.mockReset()
  prismaMock.user.createMany.mockResolvedValue({ count: 1 } as never)
  resetEnsuredAppUsers()
})

describe('ensureAppUser', () => {
  it('既存ユーザーを上書きしない形で app_users に作成する', async () => {
    await ensureAppUser({ id: 'u1', email: 'a@example.com', app_metadata: { provider: 'google' } })
    expect(prismaMock.user.createMany).toHaveBeenCalledWith({
      data: [{ id: 'u1', email: 'a@example.com', authProvider: 'google' }],
      skipDuplicates: true,
    })
  })

  it('メール・プロバイダが無ければ仮の値で作成する', async () => {
    await ensureAppUser({ id: 'u2' })
    expect(prismaMock.user.createMany).toHaveBeenCalledWith({
      data: [{ id: 'u2', email: 'temp_u2@example.com', authProvider: 'unknown' }],
      skipDuplicates: true,
    })
  })

  it('一度確認したユーザーはDBに問い合わせない', async () => {
    await ensureAppUser({ id: 'u1' })
    await ensureAppUser({ id: 'u1' })
    expect(prismaMock.user.createMany).toHaveBeenCalledTimes(1)
  })

  it('forgetAppUser 後は再度確認する', async () => {
    await ensureAppUser({ id: 'u1' })
    forgetAppUser('u1')
    await ensureAppUser({ id: 'u1' })
    expect(prismaMock.user.createMany).toHaveBeenCalledTimes(2)
  })

  it('DBエラー時はキャッシュせず、次回また確認する', async () => {
    prismaMock.user.createMany.mockRejectedValueOnce(new Error('db down'))
    await expect(ensureAppUser({ id: 'u1' })).rejects.toThrow('db down')
    await ensureAppUser({ id: 'u1' })
    expect(prismaMock.user.createMany).toHaveBeenCalledTimes(2)
  })
})
