import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { resolveStockId } from '@/lib/resolveStockId'

describe('resolveStockId', () => {
  const userId = 'test-user-id-123'

  it('stock-SYMBOL形式: 既存銘柄のUUIDを返す', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1', symbol: '7203' } as never)

    const result = await resolveStockId('stock-7203', userId)
    expect(result).toBe('stock-uuid-1')
  })

  it('stock-SYMBOL形式: 存在しない場合null', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const result = await resolveStockId('stock-9999', userId)
    expect(result).toBeNull()
  })

  it('UUID形式: 既存銘柄のUUIDを返す', async () => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)

    const result = await resolveStockId('stock-uuid-1', userId)
    expect(result).toBe('stock-uuid-1')
  })

  it('UUID形式: 存在しない場合null', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const result = await resolveStockId('nonexistent-uuid', userId)
    expect(result).toBeNull()
  })

  it('lazy作成: createIfNotFound=trueで新規作成', async () => {
    prismaMock.stock.findFirst.mockResolvedValue(null)
    prismaMock.user.upsert.mockResolvedValue({} as never)
    prismaMock.stock.aggregate.mockResolvedValue({ _max: { order: 2 } } as never)
    prismaMock.stock.create.mockResolvedValue({ id: 'new-stock-uuid' } as never)

    const result = await resolveStockId('stock-NEW1', userId, true)
    expect(result).toBe('new-stock-uuid')
    expect(prismaMock.stock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ order: 3 }),
      })
    )
  })

  it('lazy作成: 競合時に再取得', async () => {
    prismaMock.stock.findFirst
      .mockResolvedValueOnce(null) // 最初のチェック
      .mockResolvedValueOnce({ id: 'existing-uuid' } as never) // 競合後の再取得

    prismaMock.user.upsert.mockResolvedValue({} as never)
    prismaMock.stock.aggregate.mockResolvedValue({ _max: { order: 0 } } as never)
    prismaMock.stock.create.mockRejectedValue(new Error('Unique constraint'))

    const result = await resolveStockId('stock-7203', userId, true)
    expect(result).toBe('existing-uuid')
  })
})
