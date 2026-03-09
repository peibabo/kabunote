import { NextRequest } from 'next/server'

/**
 * テスト用 NextRequest を作成するヘルパー
 */
export function createRequest(
  method: string,
  url: string = 'http://localhost:3000/api/test',
  body?: unknown
): NextRequest {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  return new NextRequest(url, init)
}
