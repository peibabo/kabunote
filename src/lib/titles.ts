/**
 * 称号コレクション定義・評価ロジック
 *
 * 全25称号の定義と、集計データから獲得状態を判定する純粋関数を提供する。
 */

import type { TitleDefinition, TitleStatus, TitleCheckData } from '@/types/titles'

// ─── 称号条件定義 ──────────────────────────────

interface TitleWithCondition extends TitleDefinition {
  check: (data: TitleCheckData) => boolean
}

const TITLES: TitleWithCondition[] = [
  // ── 📈 銘柄（5個）──
  { id: 'first_stock', name: 'はじめの一歩', description: '最初の銘柄を登録', category: 'stock', icon: '🌱', rarity: 'common', check: d => d.stockCount >= 1 },
  { id: 'watchlist_5', name: 'ウォッチリスト構築', description: '5銘柄を登録', category: 'stock', icon: '📋', rarity: 'rare', check: d => d.stockCount >= 5 },
  { id: 'portfolio_10', name: 'ポートフォリオビルダー', description: '10銘柄を登録', category: 'stock', icon: '🏗️', rarity: 'rare', check: d => d.stockCount >= 10 },
  { id: 'collector_15', name: '銘柄コレクター', description: '15銘柄を登録', category: 'stock', icon: '💎', rarity: 'epic', check: d => d.stockCount >= 15 },
  { id: 'max_stocks', name: '上限マスター', description: '全20銘柄枠を使い切る', category: 'stock', icon: '👑', rarity: 'epic', check: d => d.stockCount >= 20 },

  // ── 📝 記録（5個）──
  { id: 'memo_5', name: '筆まめ投資家', description: '5つのメモを保存', category: 'record', icon: '✏️', rarity: 'common', check: d => d.memoCount >= 5 },
  { id: 'memo_20', name: '投資ノート名人', description: '20のメモを保存', category: 'record', icon: '📖', rarity: 'rare', check: d => d.memoCount >= 20 },
  { id: 'tag_10', name: 'タグ職人', description: '10個のタグを作成', category: 'record', icon: '🏷️', rarity: 'rare', check: d => d.tagCount >= 10 },
  { id: 'all_memos', name: '全銘柄メモ達成', description: '全銘柄にメモを記入', category: 'record', icon: '📚', rarity: 'legendary', check: d => d.stockCount >= 1 && d.allStocksHaveMemo },
  { id: 'all_tag_colors', name: 'カラフルタグマスター', description: '全8色のタグを使用', category: 'record', icon: '🌈', rarity: 'epic', check: d => d.distinctTagColorCount >= 8 },

  // ── 💰 資産（4個）──
  { id: 'first_position', name: '初ポジション', description: '最初のポジションを登録', category: 'asset', icon: '📊', rarity: 'common', check: d => d.positionCount >= 1 },
  { id: 'diversified', name: '分散投資家', description: '5つのポジションを保有', category: 'asset', icon: '🔀', rarity: 'rare', check: d => d.positionCount >= 5 },
  { id: 'dividend_hunter', name: '配当ハンター', description: '3銘柄の配当を登録', category: 'asset', icon: '💵', rarity: 'rare', check: d => d.dividendCount >= 3 },
  { id: 'snapshot_habit', name: 'スナップショット習慣', description: '7日分の記録を達成', category: 'asset', icon: '📸', rarity: 'epic', check: d => d.snapshotCount >= 7 },

  // ── 🎯 戦略（4個）──
  { id: 'first_strategy', name: '戦略家', description: '最初の次の一手を登録', category: 'strategy', icon: '🎯', rarity: 'common', check: d => d.nextActionCount >= 1 },
  { id: 'strategy_master', name: '戦略マスター', description: '10銘柄の次の一手を登録', category: 'strategy', icon: '🧠', rarity: 'epic', check: d => d.nextActionCount >= 10 },
  { id: 'earnings_watcher', name: '決算ウォッチャー', description: '3つの決算日を登録', category: 'strategy', icon: '📅', rarity: 'rare', check: d => d.eventCount >= 3 },
  { id: 'benefit_researcher', name: '優待リサーチャー', description: '3つの優待を登録', category: 'strategy', icon: '🎁', rarity: 'rare', check: d => d.benefitCount >= 3 },

  // ── 🔥 継続（5個）──
  { id: 'streak_3', name: '三日坊主突破', description: '3日連続ログイン', category: 'streak', icon: '🔥', rarity: 'common', check: d => d.longestStreak >= 3 },
  { id: 'streak_7', name: '一週間の習慣', description: '7日連続ログイン', category: 'streak', icon: '📆', rarity: 'common', check: d => d.longestStreak >= 7 },
  { id: 'streak_30', name: '月間投資家', description: '30日連続ログイン', category: 'streak', icon: '🏆', rarity: 'epic', check: d => d.longestStreak >= 30 },
  { id: 'level_5', name: 'レベル5到達', description: '成長する投資家に到達', category: 'streak', icon: '⭐', rarity: 'common', check: d => d.level >= 5 },
  { id: 'max_level', name: 'カンスト達成', description: '投資の神に到達', category: 'streak', icon: '🌟', rarity: 'legendary', check: d => d.level >= 20 },

  // ── 🤝 貢献（2個）──
  { id: 'first_feedback', name: '目安箱投函', description: '最初のフィードバック送信', category: 'contribution', icon: '📮', rarity: 'common', check: d => d.feedbackCount >= 1 },
  { id: 'active_supporter', name: 'アクティブサポーター', description: '5回のフィードバック送信', category: 'contribution', icon: '🙌', rarity: 'rare', check: d => d.feedbackCount >= 5 },
]

// ─── 公開API ──────────────────────────────────

/** 称号定義一覧（条件関数を除いた公開用） */
export const TITLE_DEFINITIONS: TitleDefinition[] = TITLES.map(({ check: _, ...def }) => def)

/** 称号の総数 */
export const TOTAL_TITLE_COUNT = TITLES.length

/**
 * 集計データから全称号の獲得状態を判定する（純粋関数）
 */
export function evaluateTitles(data: TitleCheckData): TitleStatus[] {
  return TITLES.map(({ check, ...def }) => ({
    ...def,
    unlocked: check(data),
  }))
}
