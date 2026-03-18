import { describe, it, expect } from 'vitest'
import { evaluateTitles, TITLE_DEFINITIONS, TOTAL_TITLE_COUNT } from '@/lib/titles'
import type { TitleCheckData } from '@/types/titles'

const emptyData: TitleCheckData = {
  stockCount: 0,
  memoCount: 0,
  tagCount: 0,
  distinctTagColorCount: 0,
  positionCount: 0,
  dividendCount: 0,
  benefitCount: 0,
  eventCount: 0,
  nextActionCount: 0,
  snapshotCount: 0,
  feedbackCount: 0,
  level: 1,
  longestStreak: 0,
  allStocksHaveMemo: false,
  checklistCompleteStreak: 0,
}

const maxData: TitleCheckData = {
  stockCount: 20,
  memoCount: 20,
  tagCount: 10,
  distinctTagColorCount: 8,
  positionCount: 5,
  dividendCount: 3,
  benefitCount: 3,
  eventCount: 3,
  nextActionCount: 10,
  snapshotCount: 7,
  feedbackCount: 5,
  level: 20,
  longestStreak: 30,
  allStocksHaveMemo: true,
  checklistCompleteStreak: 30,
}

describe('TITLE_DEFINITIONS', () => {
  it('全28個の称号が定義されている', () => {
    expect(TITLE_DEFINITIONS).toHaveLength(28)
    expect(TOTAL_TITLE_COUNT).toBe(28)
  })

  it('全称号にユニークなIDがある', () => {
    const ids = TITLE_DEFINITIONS.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('レアリティ分布: common 9, rare 10, epic 7, legendary 2', () => {
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 }
    for (const t of TITLE_DEFINITIONS) counts[t.rarity]++
    expect(counts.common).toBe(9)
    expect(counts.rare).toBe(10)
    expect(counts.epic).toBe(7)
    expect(counts.legendary).toBe(2)
  })
})

describe('evaluateTitles', () => {
  it('全条件0で全称号未獲得', () => {
    const result = evaluateTitles(emptyData)
    expect(result.every(t => !t.unlocked)).toBe(true)
  })

  it('全条件最大値で全称号獲得', () => {
    const result = evaluateTitles(maxData)
    expect(result.every(t => t.unlocked)).toBe(true)
  })

  // 銘柄カテゴリ
  it('銘柄1個で「はじめの一歩」獲得', () => {
    const result = evaluateTitles({ ...emptyData, stockCount: 1 })
    expect(result.find(t => t.id === 'first_stock')?.unlocked).toBe(true)
  })

  it('銘柄4個では「ウォッチリスト構築」未獲得', () => {
    const result = evaluateTitles({ ...emptyData, stockCount: 4 })
    expect(result.find(t => t.id === 'watchlist_5')?.unlocked).toBe(false)
  })

  it('銘柄5個で「ウォッチリスト構築」獲得', () => {
    const result = evaluateTitles({ ...emptyData, stockCount: 5 })
    expect(result.find(t => t.id === 'watchlist_5')?.unlocked).toBe(true)
  })

  it('銘柄20個で「上限マスター」獲得', () => {
    const result = evaluateTitles({ ...emptyData, stockCount: 20 })
    expect(result.find(t => t.id === 'max_stocks')?.unlocked).toBe(true)
  })

  // 記録カテゴリ
  it('メモ5件で「筆まめ投資家」獲得', () => {
    const result = evaluateTitles({ ...emptyData, memoCount: 5 })
    expect(result.find(t => t.id === 'memo_5')?.unlocked).toBe(true)
  })

  it('全銘柄メモ達成: 銘柄0個では未獲得', () => {
    const result = evaluateTitles({ ...emptyData, allStocksHaveMemo: true })
    expect(result.find(t => t.id === 'all_memos')?.unlocked).toBe(false)
  })

  it('全銘柄メモ達成: 銘柄あり+全メモありで獲得', () => {
    const result = evaluateTitles({ ...emptyData, stockCount: 3, allStocksHaveMemo: true })
    expect(result.find(t => t.id === 'all_memos')?.unlocked).toBe(true)
  })

  it('全8色タグ使用で「カラフルタグマスター」獲得', () => {
    const result = evaluateTitles({ ...emptyData, distinctTagColorCount: 8 })
    expect(result.find(t => t.id === 'all_tag_colors')?.unlocked).toBe(true)
  })

  it('7色タグでは「カラフルタグマスター」未獲得', () => {
    const result = evaluateTitles({ ...emptyData, distinctTagColorCount: 7 })
    expect(result.find(t => t.id === 'all_tag_colors')?.unlocked).toBe(false)
  })

  // 継続カテゴリ
  it('ストリーク3日で「三日坊主突破」獲得', () => {
    const result = evaluateTitles({ ...emptyData, longestStreak: 3 })
    expect(result.find(t => t.id === 'streak_3')?.unlocked).toBe(true)
  })

  it('レベル20で「カンスト達成」獲得', () => {
    const result = evaluateTitles({ ...emptyData, level: 20 })
    expect(result.find(t => t.id === 'max_level')?.unlocked).toBe(true)
  })

  it('レベル19では「カンスト達成」未獲得', () => {
    const result = evaluateTitles({ ...emptyData, level: 19 })
    expect(result.find(t => t.id === 'max_level')?.unlocked).toBe(false)
  })

  // 貢献カテゴリ
  it('フィードバック1件で「目安箱投函」獲得', () => {
    const result = evaluateTitles({ ...emptyData, feedbackCount: 1 })
    expect(result.find(t => t.id === 'first_feedback')?.unlocked).toBe(true)
  })
})
