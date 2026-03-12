import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson, createParams } from '../helpers/apiTestHelper'
import { GET, POST } from '@/app/api/favorite-groups/route'
import { PUT, DELETE } from '@/app/api/favorite-groups/[groupId]/route'
import { POST as AddStock, DELETE as RemoveStock } from '@/app/api/favorite-groups/[groupId]/stocks/route'

const mockGroup = {
  id: 'grp-1',
  userId: 'test-user-id-123',
  name: '主力保有株',
  color: 'blue',
  order: 0,
  createdAt: new Date('2024-06-01'),
  stockGroups: [
    { stock: { symbol: '7203' } },
  ],
}

describe('GET /api/favorite-groups', () => {
  it('成功: グループ一覧を取得', async () => {
    prismaMock.favoriteGroup.findMany.mockResolvedValue([mockGroup] as never)

    const req = createRequest('GET', 'http://localhost:3000/api/favorite-groups')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toHaveLength(1)
    expect(json.data[0].stocks).toEqual(['7203'])
  })
})

describe('POST /api/favorite-groups', () => {
  it('成功: グループを作成', async () => {
    prismaMock.favoriteGroup.create.mockResolvedValue({
      id: 'grp-2',
      name: '短期決戦',
      color: 'orange',
      order: 1,
      createdAt: new Date(),
    } as never)

    const req = createRequest('POST', 'http://localhost:3000/api/favorite-groups', {
      name: '短期決戦',
      color: 'orange',
    })
    const res = await POST(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data.name).toBe('短期決戦')
  })

  it('400: 名前未指定', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/favorite-groups', {})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('409: 同名のグループ', async () => {
    prismaMock.favoriteGroup.create.mockRejectedValue({ code: 'P2002' })

    const req = createRequest('POST', 'http://localhost:3000/api/favorite-groups', {
      name: '主力保有株',
    })
    const res = await POST(req)
    expect(res.status).toBe(409)
  })
})

describe('PUT /api/favorite-groups/[groupId]', () => {
  it('成功: グループを更新', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(mockGroup as never)
    prismaMock.favoriteGroup.update.mockResolvedValue({
      ...mockGroup,
      name: '新名前',
    } as never)

    const req = createRequest('PUT', 'http://localhost:3000/api/favorite-groups/grp-1', {
      name: '新名前',
    })
    const res = await PUT(req, createParams({ groupId: 'grp-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('404: グループが見つからない', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(null)

    const req = createRequest('PUT', 'http://localhost:3000/api/favorite-groups/grp-999', {
      name: 'test',
    })
    const res = await PUT(req, createParams({ groupId: 'grp-999' }))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/favorite-groups/[groupId]', () => {
  it('成功: グループを削除', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(mockGroup as never)
    prismaMock.favoriteGroup.delete.mockResolvedValue(mockGroup as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/favorite-groups/grp-1')
    const res = await DELETE(req, createParams({ groupId: 'grp-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('404: グループが見つからない', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(null)

    const req = createRequest('DELETE', 'http://localhost:3000/api/favorite-groups/grp-999')
    const res = await DELETE(req, createParams({ groupId: 'grp-999' }))
    expect(res.status).toBe(404)
  })
})

describe('POST /api/favorite-groups/[groupId]/stocks', () => {
  it('成功: 銘柄を追加', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(mockGroup as never)
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockFavoriteGroup.upsert.mockResolvedValue({} as never)

    const req = createRequest('POST', 'http://localhost:3000/api/favorite-groups/grp-1/stocks', {
      symbol: '7203',
    })
    const res = await AddStock(req, createParams({ groupId: 'grp-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })

  it('400: symbol未指定', async () => {
    const req = createRequest('POST', 'http://localhost:3000/api/favorite-groups/grp-1/stocks', {})
    const res = await AddStock(req, createParams({ groupId: 'grp-1' }))
    expect(res.status).toBe(400)
  })

  it('404: 銘柄が見つからない', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(mockGroup as never)
    prismaMock.stock.findFirst.mockResolvedValue(null)

    const req = createRequest('POST', 'http://localhost:3000/api/favorite-groups/grp-1/stocks', {
      symbol: '9999',
    })
    const res = await AddStock(req, createParams({ groupId: 'grp-1' }))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/favorite-groups/[groupId]/stocks', () => {
  it('成功: 銘柄を削除', async () => {
    prismaMock.favoriteGroup.findFirst.mockResolvedValue(mockGroup as never)
    prismaMock.stock.findFirst.mockResolvedValue({ id: 'stock-uuid-1' } as never)
    prismaMock.stockFavoriteGroup.deleteMany.mockResolvedValue({ count: 1 } as never)

    const req = createRequest('DELETE', 'http://localhost:3000/api/favorite-groups/grp-1/stocks', {
      symbol: '7203',
    })
    const res = await RemoveStock(req, createParams({ groupId: 'grp-1' }))
    const json = await getJson(res)
    expect(json.success).toBe(true)
  })
})
