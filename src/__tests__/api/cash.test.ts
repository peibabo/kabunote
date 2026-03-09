import { describe, it, expect, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, POST } from '@/app/api/cash/route'

describe('GET /api/cash', () => {
  it('成功: 現金残高を取得', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      cashAmount: '500000',
      nextActionMemo: 'テストメモ',
    } as never)

    const req = createRequest('GET', 'http://localhost:3000/api/cash')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.cashAmount).toBe('500000')
    expect(json.nextActionMemo).toBe('テストメモ')
  })

  it('デフォルト: ユーザーなしの場合', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/cash')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.cashAmount).toBe('0')
    expect(json.nextActionMemo).toBe('')
  })
})

describe('POST /api/cash', () => {
  it('成功: 現金残高を更新', async () => {
    prismaMock.user.upsert.mockResolvedValue({
      cashAmount: '600000',
      nextActionMemo: '',
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/cash', {
      cashAmount: '600000',
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(json.cashAmount).toBe('600000')
  })

  it('400: 負数', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/cash', {
      cashAmount: '-100',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('400: NaN', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/cash', {
      cashAmount: 'abc',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('upsert: ユーザーが存在しない場合も作成', async () => {
    prismaMock.user.upsert.mockResolvedValue({
      cashAmount: '100000',
      nextActionMemo: null,
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/cash', {
      cashAmount: '100000',
    })
    await POST(req)
    expect(prismaMock.user.upsert).toHaveBeenCalled()
  })
})
