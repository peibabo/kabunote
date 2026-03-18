/** 称号カテゴリ */
export type TitleCategory = 'stock' | 'record' | 'asset' | 'strategy' | 'streak' | 'contribution'

/** 称号レアリティ */
export type TitleRarity = 'common' | 'rare' | 'epic' | 'legendary'

/** 称号定義 */
export interface TitleDefinition {
  id: string
  name: string
  description: string
  category: TitleCategory
  icon: string
  rarity: TitleRarity
}

/** 称号状態（獲得済みかどうか） */
export interface TitleStatus extends TitleDefinition {
  unlocked: boolean
}

/** 称号API レスポンス */
export interface TitlesResponse {
  titles: TitleStatus[]
  unlockedCount: number
  totalCount: number
}

/** 称号判定に必要な集計データ */
export interface TitleCheckData {
  stockCount: number
  memoCount: number
  tagCount: number
  distinctTagColorCount: number
  positionCount: number
  dividendCount: number
  benefitCount: number
  eventCount: number
  nextActionCount: number
  snapshotCount: number
  feedbackCount: number
  level: number
  longestStreak: number
  allStocksHaveMemo: boolean
}

/** カテゴリ表示情報 */
export const TITLE_CATEGORY_INFO: Record<TitleCategory, { label: string; icon: string }> = {
  stock: { label: '銘柄', icon: '📈' },
  record: { label: '記録', icon: '📝' },
  asset: { label: '資産', icon: '💰' },
  strategy: { label: '戦略', icon: '🎯' },
  streak: { label: '継続', icon: '🔥' },
  contribution: { label: '貢献', icon: '🤝' },
}
