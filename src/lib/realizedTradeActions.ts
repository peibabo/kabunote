// 確定損益（売却記録）に対するクライアント側アクション（フック/コンポーネント共用）

import { apiDelete } from '@/lib/apiClient'

/**
 * 確定損益を削除する。削除後、銘柄別履歴・年間サマリーを同期させるため
 * `kabunote-db-realized-update` イベントを発火する（両フックがlistenして再取得）。
 * 保有ポジションには触れないため position-update は発火しない。
 */
export async function deleteRealizedTrade(tradeId: string, stockId?: string): Promise<void> {
  await apiDelete(`/api/portfolio/realized/${tradeId}`)
  window.dispatchEvent(new CustomEvent('kabunote-db-realized-update', { detail: { stockId } }))
}
