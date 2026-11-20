export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP ${response.status}`)
  }
  const result = await response.json()
  if (!result.success) throw new Error('APIレスポンスが無効です')
  return result.data as T
}

export function apiPut<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiFetch<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function apiDelete<T>(url: string): Promise<T> {
  return apiFetch<T>(url, { method: 'DELETE' })
}

/** 過去スナップショットの個別株価修正の入力 */
export interface SnapshotStockPrice {
  stockId: string
  currentPrice: number
}

/**
 * 過去スナップショットの個別株価を修正する（PATCH /api/portfolio/snapshot/[id]）。
 * エンドポイントとリクエストボディの契約をここに集約（推移グラフ・銘柄カード双方から利用）。
 */
export function patchSnapshotPrices<T = unknown>(
  snapshotId: string,
  prices: SnapshotStockPrice[],
): Promise<T> {
  return apiPatch<T>(`/api/portfolio/snapshot/${snapshotId}`, { stockPrices: prices })
}

/** 後から追加する日の銘柄ごとの初期値（GET /api/portfolio/snapshot/backfill） */
export interface BackfillPreviewStock {
  stockId: string
  symbol: string
  name: string | null
  shares: number
  cost: number
  suggestedPrice: number | null
}

export interface BackfillPreview {
  date: string
  stocks: BackfillPreviewStock[]
  suggestedCash: number
}

/** 記録し忘れた日の保有・株価・現金の初期値を取得する */
export function getBackfillPreview(date: string): Promise<BackfillPreview> {
  return apiFetch<BackfillPreview>(`/api/portfolio/snapshot/backfill?date=${encodeURIComponent(date)}`)
}

/** 記録し忘れた日のスナップショットを追加する（XP は付かない） */
export function postBackfillSnapshot<T = unknown>(
  date: string,
  prices: SnapshotStockPrice[],
  cashAmount: number,
): Promise<T> {
  return apiPost<T>('/api/portfolio/snapshot/backfill', { date, stockPrices: prices, cashAmount })
}

/** 直近で記録していない営業日（新しい順） */
export async function getMissingSnapshotDates(): Promise<string[]> {
  const data = await apiFetch<{ missingDates: string[] }>('/api/portfolio/snapshot/missing')
  return data.missingDates
}
