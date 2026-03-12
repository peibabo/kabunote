import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PUT, DELETE } from '@/app/api/tags/route'

describe('GET /api/tags', () => {
  it('成功: タグ一覧を取得', async () => {
    prismaMock.stockTag.findMany.mockResolvedValue([
      { name: '高配当', color: 'red' },
      { name: '高配当', color: 'red' },
      { name: 'グロース', color: 'green' },
    ] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/tags')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(2)
    expect(json.data[0].count).toBe(2) // 使用頻度順
  })
})

describe('PUT /api/tags', () => {
  it('成功: タグを一括更新', async () => {
    prismaMock.stockTag.updateMany.mockResolvedValue({ count: 3 } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/tags', {
      oldLabel: '高配当',
      newLabel: '高配当銘柄',
      newColor: 'orange',
    })
    const res = await PUT(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('400: 必須パラメータなし', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/tags', {
      oldLabel: '高配当',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/tags', () => {
  it('成功: タグを一括削除', async () => {
    prismaMock.stockTag.deleteMany.mockResolvedValue({ count: 2 } as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/tags', {
      label: '高配当',
    })
    const res = await DELETE(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('400: label未指定', async () => {
    const req = createRequest('DELETE', 'http://localhost:3000/api/tags', {})
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })
})
