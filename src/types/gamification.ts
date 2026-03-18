/** ゲーミフィケーション状態 */
export interface GamificationState {
  totalXp: number
  level: number
  dailyXp: number
  currentStreak: number
  longestStreak: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  levelName: string
  nextLevelName: string | null
}

/** XP付与結果 */
export interface XpGrantResult {
  xpEarned: number
  streakBonus: number
  leveledUp: boolean
  newLevel?: number
  newLevelName?: string
  dailyCapReached: boolean
  totalXp: number
  level: number
  dailyXp: number
  currentStreak: number
}

/** XPアクション種別 */
export type XpActionType =
  | 'LOGIN'
  | 'STOCK_ADD'
  | 'MEMO_SAVE'
  | 'TAG_ADD'
  | 'PRICE_UPDATE'
  | 'POSITION_ADD'
  | 'PORTFOLIO_SNAPSHOT'
  | 'EVENT_REGISTER'
  | 'DIVIDEND_REGISTER'
  | 'BENEFIT_REGISTER'
  | 'NEXT_ACTION'
  | 'FEEDBACK'
  | 'CHECKLIST_COMPLETE'
  | 'DIARY_SAVE'

/** アクティビティログ */
export interface XpActivityLogEntry {
  id: string
  actionType: string
  xpEarned: number
  description: string | null
  createdAt: string
}
