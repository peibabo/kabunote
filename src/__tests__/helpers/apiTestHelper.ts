import { NextRequest } from 'next/server'

/**
 * テスト用のNextRequestを作成するヘルパー
 */
export function createRequest(
  method: string,
  url: string = 'http://localhost:3000/api/test',
  body?: unknown
): NextRequest {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(url, init)
}

/**
 * レスポンスからJSONを取得
 */
export async function getJson(response: Response) {
  return response.json()
}

/**
 * paramsをPromiseでラップ（Next.js 16のApp Router形式）
 */
export function createParams(params: Record<string, string>) {
  return { params: Promise.resolve(params) }
}
