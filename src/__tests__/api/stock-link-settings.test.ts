import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import '../mocks/supabase'
import { createRequest, getJson } from '../helpers/apiTestHelper'
import { GET, PUT } from '@/app/api/stock-link-settings/route'
import { DEFAULT_STOCK_LINK_SETTINGS } from '@/lib/stockExternalLinks'

describe('GET /api/stock-link-settings', () => {
  it('成功: 設定を取得', async () => {
    const mockSettings = [
      { key: 'yahoo', visible: true, order: 0 },
      { key: 'kabutan', visible: false, order: 1 },
    ]
    prismaMock.userStockLinkSetting.findUnique.mockResolvedValue({
      settings: mockSettings,
    })

    const req = createRequest('GET', 'http://localhost:3000/api/stock-link-settings')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockSettings)
  })

  it('未設定: data=null', async () => {
    prismaMock.userStockLinkSetting.findUnique.mockResolvedValue(null)

    const req = createRequest('GET', 'http://localhost:3000/api/stock-link-settings')
    const res = await GET(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toBeNull()
  })
})

describe('PUT /api/stock-link-settings', () => {
  it('成功: 設定を保存', async () => {
    const settings = DEFAULT_STOCK_LINK_SETTINGS.map((s, i) => ({
      ...s,
      visible: i !== 2, // TradingViewを非表示
    }))
    prismaMock.userStockLinkSetting.upsert.mockResolvedValue({
      settings,
    })

    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', { settings })
    const res = await PUT(req)
    const json = await getJson(res)
    expect(json.success).toBe(true)
    expect(json.data).toEqual(settings)
  })

  it('400: 配列でない', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', {
      settings: 'invalid',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 個数が不正', async () => {
    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', {
      settings: [{ key: 'yahoo', visible: true, order: 0 }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 無効なキー', async () => {
    const settings = DEFAULT_STOCK_LINK_SETTINGS.map(s => ({ ...s }))
    settings[0].key = 'invalid-key'

    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', { settings })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 重複するキー', async () => {
    const settings = DEFAULT_STOCK_LINK_SETTINGS.map(s => ({ ...s }))
    settings[1].key = settings[0].key

    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', { settings })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: visibleがboolean以外', async () => {
    const settings = DEFAULT_STOCK_LINK_SETTINGS.map(s => ({ ...s }))
    ;(settings[0] as Record<string, unknown>).visible = 'yes'

    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', { settings })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: orderが範囲外', async () => {
    const settings = DEFAULT_STOCK_LINK_SETTINGS.map(s => ({ ...s }))
    settings[0].order = 99

    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', { settings })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('400: 重複するorder', async () => {
    const settings = DEFAULT_STOCK_LINK_SETTINGS.map(s => ({ ...s }))
    settings[1].order = settings[0].order

    const req = createRequest('PUT', 'http://localhost:3000/api/stock-link-settings', { settings })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})
