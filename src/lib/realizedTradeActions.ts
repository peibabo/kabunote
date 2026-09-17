// 確定損益（売却記録）に対するクライアント側アクション（フック/コンポーネント共用）

import { apiDelete } from '@/lib/apiClient'
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'

/**
 * 確定損益を削除する。削除後、銘柄別履歴・年間サマリーを同期させるため
 * DB_REALIZED_UPDATE イベントを発火する（両フックがlistenして再取得）。
 * 保有ポジションには触れないため position-update は発火しない。
 */
export async function deleteRealizedTrade(tradeId: string, stockId?: string): Promise<void> {
  await apiDelete(`/api/portfolio/realized/${tradeId}`)
  emitAppEvent(APP_EVENTS.DB_REALIZED_UPDATE, { stockId })
}
