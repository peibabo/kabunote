import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PUT } from '@/app/api/external-links/route'

describe('GET /api/external-links', () => {
  it('成功: リンク一覧を取得', async () => {
    const mockLinks = [
      { id: '1', url: 'https://example.com', label: 'Test', icon: '📈', gradient: 'from-green-600 to-blue-600', order: 0 },
    ]
    prismaMock.userExternalLink.findMany.mockResolvedValue(mockLinks)

    const req = createRequest('GET', 'http://localhost:3000/api/external-links')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockLinks)
  })

  it('未設定: data=null', async () => {
    prismaMock.userExternalLink.findMany.mockResolvedValue([])

    const req = createRequest('GET', 'http://localhost:3000/api/external-links')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toBeNull()
  })
})

describe('PUT /api/external-links', () => {
  it('成功: リンクを一括更新', async () => {
    const inputLinks = [
      { url: 'https://example.com', label: 'Test', icon: '📈', gradient: 'from-green-600 to-blue-600' },
    ]
    const savedLinks = [
      { id: '1', url: 'https://example.com', label: 'Test', icon: '📈', gradient: 'from-green-600 to-blue-600', order: 0 },
    ]
    prismaMock.userExternalLink.deleteMany.mockResolvedValue({ count: 0 })
    prismaMock.userExternalLink.createMany.mockResolvedValue({ count: 1 })
    prismaMock.userExternalLink.findMany.mockResolvedValue(savedLinks)

    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', {
      links: inputLinks,
    })
    const res = await PUT(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toEqual(savedLinks)
  })

  it('成功: 空配列で全削除', async () => {
    prismaMock.userExternalLink.deleteMany.mockResolvedValue({ count: 4 })

    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', {
      links: [],
    })
    const res = await PUT(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toEqual([])
  })

  it('400: 配列でない', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', {
      links: 'invalid',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 13個以上', async () => {
    const links = Array(13).fill({
      url: 'https://example.com',
      label: 'Test',
      icon: '📈',
      gradient: 'from-green-600 to-blue-600',
    })
    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', { links })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 無効なURL', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', {
      links: [{ url: 'not-valid', label: 'Test', icon: '📈', gradient: 'from-green-600 to-blue-600' }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 無効なグラデーション', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', {
      links: [{ url: 'https://example.com', label: 'Test', icon: '📈', gradient: 'invalid-gradient' }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 空ラベル', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/external-links', {
      links: [{ url: 'https://example.com', label: '', icon: '📈', gradient: 'from-green-600 to-blue-600' }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
