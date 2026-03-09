import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/stocks/[stockId]/event/route'

describe('GET /api/stocks/[stockId]/event', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('成功: イベント情報を取得', async () => {
    prismaMock.stockEvent.findMany.mockResolvedValue([
      {
        id: 'ev-1',
        eventType: 'EARNINGS',
        eventDate: new Date('2024-07-30'),
      },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/event')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.earnings.eventDate).toBe('2024-07-30')
  })

  it('イベントなしの場合null', async () => {
    prismaMock.stockEvent.findMany.mockResolvedValue([] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/stocks/stock-7203/event')
    const res = await GET(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.data.earnings).toBeNull()
    expect(json.data.shareholderMeeting).toBeNull()
  })
})

describe('PUT /api/stocks/[stockId]/event', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
  })

  it('EARNINGS更新', async () => {
    prismaMock.stockEvent.upsert.mockResolvedValue({
      id: 'ev-1',
      eventDate: new Date('2024-08-01'),
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/event', {
      eventType: 'EARNINGS',
      eventDate: '2024-08-01',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('SHAREHOLDER_MEETING更新', async () => {
    prismaMock.stockEvent.upsert.mockResolvedValue({
      id: 'ev-2',
      eventMonth: 6,
      eventDay: 25,
      isRecurring: true,
      isActive: true,
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/event', {
      eventType: 'SHAREHOLDER_MEETING',
      eventMonth: 6,
      eventDay: 25,
      isRecurring: true,
      isActive: true,
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.eventMonth).toBe(6)
  })

  it('400: 不正なeventType', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stocks/stock-7203/event', {
      eventType: 'INVALID',
    })
    const res = await PUT(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/stocks/[stockId]/event', () => {
  beforeEach(() => {
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockEvent.deleteMany.mockResolvedValue({ count: 1 } as never)
  })

  it('成功: イベントを削除', async () => {
    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/event?eventType=EARNINGS')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('400: eventType未指定', async () => {
    const req = createRequest('DELETE', 'http://localhost:3000/api/stocks/stock-7203/event')
    const res = await DELETE(req, createParams({ stockId: 'stock-7203' }))
    expect(res.status).toBe(400)
  })
})
