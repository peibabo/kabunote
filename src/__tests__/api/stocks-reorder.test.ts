import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { PATCH } from '@/app/api/stocks/reorder/route'

describe('PATCH /api/stocks/reorder', () => {
  beforeEach(() => {
    prismaMock.stock.updateMany.mockResolvedValue({ count: 1 } as never)
  })

  it('成功: 並び順を更新', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/stocks/reorder', {
      symbols: ['7203', '9984', '6758'],
    })
    const res = await PATCH(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(prismaMock.$transaction).toHaveBeenCalled()
  })

  it('400: 非配列', async () => {
    const req = createRequest('PATCH', 'http://localhost:3000/api/stocks/reorder', {
      symbols: 'not-array',
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})
