/**
 * ゲーミフィケーション（投資家レベル・経験値）システム
 *
 * XP定数、レベル計算、ランク名称、grantXp() ユーティリティを提供する。
 */

import type { XpActionType, XpGrantResult } from '@/types/gamification'

// ─── XP 定数 ──────────────────────────────────

/** アクションごとの獲得XP */
export const XP_VALUES: Record<XpActionType, number> = {
  LOGIN: 10,
  STOCK_ADD: 15,
  MEMO_SAVE: 10,
  TAG_ADD: 5,
  PRICE_UPDATE: 5,
  POSITION_ADD: 15,
  PORTFOLIO_SNAPSHOT: 20,
  EVENT_REGISTER: 10,
  DIVIDEND_REGISTER: 10,
  BENEFIT_REGISTER: 10,
  NEXT_ACTION: 15,
  FEEDBACK: 20,
  CHECKLIST_COMPLETE: 15,
}

/** アクションの日本語説明 */
export const XP_DESCRIPTIONS: Record<XpActionType, string> = {
  LOGIN: 'ログイン',
  STOCK_ADD: '銘柄追加',
  MEMO_SAVE: 'メモ保存',
  TAG_ADD: 'タグ追加',
  PRICE_UPDATE: '株価更新',
  POSITION_ADD: 'ポジション追加',
  PORTFOLIO_SNAPSHOT: 'ポートフォリオ記録',
  EVENT_REGISTER: '決算日登録',
  DIVIDEND_REGISTER: '配当情報登録',
  BENEFIT_REGISTER: '優待情報登録',
  NEXT_ACTION: 'Next Action登録',
  FEEDBACK: 'フィードバック送信',
  CHECKLIST_COMPLETE: 'チェックリスト全完了',
}

/** 日次XP上限 */
export const DAILY_XP_CAP = 100

// ─── レベル計算 ────────────────────────────────

/**
 * レベルnに到達するために必要な累積XP
 * Lv2: 100, Lv5: 700, Lv10: 2700, Lv20: 10450
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.floor(50 * (level - 1) * level / 2 + 50 * (level - 1))
}

/** 累積XPからレベルを計算 */
export function levelFromXp(totalXp: number): number {
  let level = 1
  while (xpForLevel(level + 1) <= totalXp) level++
  return Math.min(level, MAX_LEVEL)
}

// ─── 投資家ランク ──────────────────────────────

export const MAX_LEVEL = 20

export const LEVEL_NAMES: Record<number, string> = {
  1: '見習い投資家',
  2: '初心者投資家',
  3: '勉強中の投資家',
  4: '堅実な投資家',
  5: '成長する投資家',
  6: '情報通の投資家',
  7: '分析家見習い',
  8: '戦略的投資家',
  9: '熟練の投資家',
  10: 'ベテラン投資家',
  11: '市場の目利き',
  12: '投資マイスター',
  13: '相場師',
  14: '投資の達人',
  15: 'マーケットマスター',
  16: '伝説の投資家',
  17: 'ウォール街の賢者',
  18: '投資の鬼才',
  19: '兜町の覇者',
  20: '投資の神',
}

// ─── ストリークボーナス ─────────────────────────

/** 連続日数に応じたボーナスXPを返す */
export function getStreakBonus(streak: number): number {
  if (streak >= 30) return 20
  if (streak >= 14) return 15
  if (streak >= 7) return 10
  if (streak >= 3) return 5
  return 0
}

// ─── fire-and-forget XP付与（クライアント用） ──

/**
 * XPを付与する（fire-and-forget）
 * 既存フックから呼び出し、メイン処理には影響しない
 */
export function grantXp(actionType: XpActionType): void {
  if (typeof window === 'undefined') return

  fetch('/api/gamification/xp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ actionType }),
  })
    .then(res => {
      if (res.ok) return res.json()
      return null
    })
    .then((data: { data: XpGrantResult } | null) => {
      if (!data?.data) return
      const result = data.data

      if (result.xpEarned > 0) {
        window.dispatchEvent(
          new CustomEvent('kabunote-xp-gained', { detail: result })
        )
      }
      if (result.leveledUp) {
        window.dispatchEvent(
          new CustomEvent('kabunote-level-up', {
            detail: { level: result.newLevel, levelName: result.newLevelName },
          })
        )
      }
    })
    .catch(() => {
      // XP付与失敗は無視
    })
}
