import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiFetch, apiPut, apiPost, apiDelete } from '@/lib/apiClient'

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('apiFetch が成功レスポンスを返す', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 1 } }), { status: 200 })
    )
    const result = await apiFetch('/api/test')
    expect(result).toEqual({ id: 1 })
  })

  it('apiFetch がHTTPエラーでthrow', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 })
    )
    await expect(apiFetch('/api/test')).rejects.toThrow('Not Found')
  })

  it('apiFetch がsuccess=falseでthrow', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 })
    )
    await expect(apiFetch('/api/test')).rejects.toThrow('APIレスポンスが無効です')
  })

  it('apiFetch がJSONパースエラーでHTTPステータスをthrow', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('invalid json', { status: 500, statusText: 'Internal Server Error' })
    )
    await expect(apiFetch('/api/test')).rejects.toThrow('HTTP 500')
  })

  it('apiPut がPUTリクエストを送信', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 })
    )
    const result = await apiPut('/api/test', { key: 'value' })
    expect(result).toEqual({ ok: true })
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'PUT' }))
  })

  it('apiPost がPOSTリクエストを送信', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { id: 2 } }), { status: 200 })
    )
    const result = await apiPost('/api/test', { name: 'test' })
    expect(result).toEqual({ id: 2 })
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'POST' }))
  })

  it('apiDelete がDELETEリクエストを送信', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: null }), { status: 200 })
    )
    const result = await apiDelete('/api/test')
    expect(result).toBeNull()
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'DELETE' }))
  })

  it('apiPost がContent-Typeを設定', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: {} }), { status: 200 })
    )
    await apiPost('/api/test', {})
    expect(fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: { 'Content-Type': 'application/json' },
    }))
  })
})
