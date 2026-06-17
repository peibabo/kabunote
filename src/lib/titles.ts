/**
 * 称号コレクション定義・評価ロジック
 *
 * 全28称号の定義と、集計データから獲得状態を判定する純粋関数を提供する。
 */

import type { TitleDefinition, TitleStatus, TitleCheckData } from '@/types/titles'

// ─── 称号条件定義 ──────────────────────────────

interface TitleWithCondition extends TitleDefinition {
  check: (data: TitleCheckData) => boolean
}

const TITLES: TitleWithCondition[] = [
  // ── 📈 銘柄（5個）──
  { id: 'first_stock', name: 'はじめの一歩', description: '最初の銘柄を登録', hint: '銘柄管理から最初の銘柄を追加してみよう', category: 'stock', icon: '🌱', rarity: 'common', check: d => d.stockCount >= 1 },
  { id: 'watchlist_5', name: 'ウォッチリスト構築', description: '5銘柄を登録', hint: '気になる銘柄を5つ登録しよう', category: 'stock', icon: '📋', rarity: 'rare', check: d => d.stockCount >= 5 },
  { id: 'portfolio_10', name: 'ポートフォリオビルダー', description: '10銘柄を登録', hint: 'ウォッチリストを10銘柄まで広げよう', category: 'stock', icon: '🏗️', rarity: 'rare', check: d => d.stockCount >= 10 },
  { id: 'collector_15', name: '銘柄コレクター', description: '15銘柄を登録', hint: 'さらに銘柄を追加して15銘柄を目指そう', category: 'stock', icon: '💎', rarity: 'epic', check: d => d.stockCount >= 15 },
  { id: 'max_stocks', name: '上限マスター', description: '全20銘柄枠を使い切る', hint: '20銘柄の枠をすべて使い切ろう', category: 'stock', icon: '👑', rarity: 'epic', check: d => d.stockCount >= 20 },

  // ── 📝 記録（5個）──
  { id: 'memo_5', name: '筆まめ投資家', description: '5つのメモを保存', hint: '銘柄カードからメモを書いてみよう', category: 'record', icon: '✏️', rarity: 'common', check: d => d.memoCount >= 5 },
  { id: 'memo_20', name: '投資ノート名人', description: '20のメモを保存', hint: '投資判断をメモに残す習慣をつけよう', category: 'record', icon: '📖', rarity: 'rare', check: d => d.memoCount >= 20 },
  { id: 'tag_10', name: 'タグ職人', description: '10個のタグを作成', hint: 'メモにタグをつけて整理しよう', category: 'record', icon: '🏷️', rarity: 'rare', check: d => d.tagCount >= 10 },
  { id: 'all_memos', name: '全銘柄メモ達成', description: '全銘柄にメモを記入', hint: '登録中の全銘柄にメモを書こう', category: 'record', icon: '📚', rarity: 'legendary', check: d => d.stockCount >= 1 && d.allStocksHaveMemo },
  { id: 'all_tag_colors', name: 'カラフルタグマスター', description: '全8色のタグを使用', hint: 'タグの全8色を使い分けてみよう', category: 'record', icon: '🌈', rarity: 'epic', check: d => d.distinctTagColorCount >= 8 },

  // ── 💰 資産（4個）──
  { id: 'first_position', name: '初ポジション', description: '最初のポジションを登録', hint: '保有株のポジション情報を登録しよう', category: 'asset', icon: '📊', rarity: 'common', check: d => d.positionCount >= 1 },
  { id: 'diversified', name: '分散投資家', description: '5つのポジションを保有', hint: '5つ以上のポジションで分散投資しよう', category: 'asset', icon: '🔀', rarity: 'rare', check: d => d.positionCount >= 5 },
  { id: 'dividend_hunter', name: '配当ハンター', description: '3銘柄の配当を登録', hint: '配当情報を3銘柄分登録しよう', category: 'asset', icon: '💵', rarity: 'rare', check: d => d.dividendCount >= 3 },
  { id: 'snapshot_habit', name: '記録の習慣', description: '7日分の終値を記録', hint: '「本日の終値を確定」ボタンで7日分記録しよう', category: 'asset', icon: '📸', rarity: 'epic', check: d => d.snapshotCount >= 7 },
  { id: 'first_sell', name: '初めての利益確定', description: '最初の売却を記録', hint: '保有ポジションを売却して確定損益を記録しよう', category: 'asset', icon: '🎉', rarity: 'common', check: d => d.realizedTradeCount >= 1 },
  { id: 'trade_10', name: 'ベテラントレーダー', description: '10回の売却を記録', hint: '売却を重ねて取引経験を積もう', category: 'asset', icon: '📈', rarity: 'rare', check: d => d.realizedTradeCount >= 10 },
  { id: 'profit_taker', name: '利確マスター', description: '累計実現利益が10万円を突破', hint: '利益を確定させて累計実現損益をプラスに伸ばそう', category: 'asset', icon: '💹', rarity: 'epic', check: d => d.totalRealizedProfit >= 100000 },

  // ── 🎯 戦略（4個）──
  { id: 'first_strategy', name: '戦略家', description: '最初の次の一手を登録', hint: '銘柄の「次の一手」を設定してみよう', category: 'strategy', icon: '🎯', rarity: 'common', check: d => d.nextActionCount >= 1 },
  { id: 'strategy_master', name: '戦略マスター', description: '10銘柄の次の一手を登録', hint: '10銘柄すべてに次の一手を設定しよう', category: 'strategy', icon: '🧠', rarity: 'epic', check: d => d.nextActionCount >= 10 },
  { id: 'earnings_watcher', name: '決算ウォッチャー', description: '3つの決算日を登録', hint: '気になる銘柄の決算日を登録しよう', category: 'strategy', icon: '📅', rarity: 'rare', check: d => d.eventCount >= 3 },
  { id: 'benefit_researcher', name: '優待リサーチャー', description: '3つの優待を登録', hint: '株主優待の情報を3銘柄分登録しよう', category: 'strategy', icon: '🎁', rarity: 'rare', check: d => d.benefitCount >= 3 },

  // ── ✅ ルーティン（3個）──
  { id: 'checklist_first', name: 'ルーティン開始', description: 'チェックリスト初回全完了', hint: 'デイリーチェックリストを全項目完了しよう', category: 'streak', icon: '✅', rarity: 'common', check: d => d.checklistCompleteStreak >= 1 },
  { id: 'checklist_7', name: '朝活投資家', description: 'チェックリスト7日連続全完了', hint: '毎日チェックリストを完了して7日続けよう', category: 'streak', icon: '🌅', rarity: 'rare', check: d => d.checklistCompleteStreak >= 7 },
  { id: 'checklist_30', name: '鉄の規律', description: 'チェックリスト30日連続全完了', hint: '毎日チェックリストを完了して30日続けよう', category: 'streak', icon: '🛡️', rarity: 'epic', check: d => d.checklistCompleteStreak >= 30 },

  // ── 🔥 継続（5個）──
  { id: 'streak_3', name: '三日坊主突破', description: '営業日3日連続アクセス', hint: '相場が開いている日に3日続けてアクセスしよう（土日祝は途切れません）', category: 'streak', icon: '🔥', rarity: 'common', check: d => d.longestStreak >= 3 },
  { id: 'streak_7', name: '一週間の習慣', description: '営業日7日連続アクセス', hint: '相場が開いている日に7日続けてアクセスしよう（土日祝は途切れません）', category: 'streak', icon: '📆', rarity: 'common', check: d => d.longestStreak >= 7 },
  { id: 'streak_30', name: '月間投資家', description: '営業日30日連続アクセス', hint: '相場が開いている日に30日続けてアクセスしよう（土日祝は途切れません）', category: 'streak', icon: '🏆', rarity: 'epic', check: d => d.longestStreak >= 30 },
  { id: 'level_5', name: 'レベル5到達', description: '成長する投資家に到達', hint: 'XPを貯めてレベル5を目指そう', category: 'streak', icon: '⭐', rarity: 'common', check: d => d.level >= 5 },
  { id: 'max_level', name: 'カンスト達成', description: '投資の神に到達', hint: 'レベル20に到達しよう', category: 'streak', icon: '🌟', rarity: 'legendary', check: d => d.level >= 20 },

  // ── 🤝 貢献（2個）──
  { id: 'first_feedback', name: '目安箱投函', description: '最初のフィードバック送信', hint: '開発者にフィードバックを送ってみよう', category: 'contribution', icon: '📮', rarity: 'common', check: d => d.feedbackCount >= 1 },
  { id: 'active_supporter', name: 'アクティブサポーター', description: '5回のフィードバック送信', hint: 'フィードバックを5回送信しよう', category: 'contribution', icon: '🙌', rarity: 'rare', check: d => d.feedbackCount >= 5 },
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
