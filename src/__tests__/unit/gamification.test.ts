import { describe, it, expect } from 'vitest'
import {
  xpForLevel,
  levelFromXp,
  getStreakBonus,
  XP_VALUES,
  LEVEL_NAMES,
  MAX_LEVEL,
  DAILY_XP_CAP,
  XP_DESCRIPTIONS,
} from '@/lib/gamification'

describe('xpForLevel', () => {
  it('Lv1は0XP', () => {
    expect(xpForLevel(1)).toBe(0)
  })

  it('Lv2は100XP', () => {
    expect(xpForLevel(2)).toBe(100)
  })

  it('Lv5は700XP', () => {
    expect(xpForLevel(5)).toBe(700)
  })

  it('Lv10は2700XP', () => {
    expect(xpForLevel(10)).toBe(2700)
  })

  it('レベルが上がるほど必要XPが増加', () => {
    for (let i = 2; i <= MAX_LEVEL; i++) {
      expect(xpForLevel(i)).toBeGreaterThan(xpForLevel(i - 1))
    }
  })

  it('Lv0以下は0', () => {
    expect(xpForLevel(0)).toBe(0)
    expect(xpForLevel(-1)).toBe(0)
  })
})

describe('levelFromXp', () => {
  it('0XPはLv1', () => {
    expect(levelFromXp(0)).toBe(1)
  })

  it('99XPはLv1', () => {
    expect(levelFromXp(99)).toBe(1)
  })

  it('100XPはLv2', () => {
    expect(levelFromXp(100)).toBe(2)
  })

  it('700XPはLv5', () => {
    expect(levelFromXp(700)).toBe(5)
  })

  it('2700XPはLv10', () => {
    expect(levelFromXp(2700)).toBe(10)
  })

  it('xpForLevelの逆関数として正しい', () => {
    for (let lv = 1; lv <= MAX_LEVEL; lv++) {
      const xp = xpForLevel(lv)
      expect(levelFromXp(xp)).toBe(lv)
    }
  })

  it('MAX_LEVELを超えない', () => {
    expect(levelFromXp(999999)).toBe(MAX_LEVEL)
  })
})

describe('getStreakBonus', () => {
  it('1-2日はボーナスなし', () => {
    expect(getStreakBonus(1)).toBe(0)
    expect(getStreakBonus(2)).toBe(0)
  })

  it('3-6日は+5', () => {
    expect(getStreakBonus(3)).toBe(5)
    expect(getStreakBonus(6)).toBe(5)
  })

  it('7-13日は+10', () => {
    expect(getStreakBonus(7)).toBe(10)
    expect(getStreakBonus(13)).toBe(10)
  })

  it('14-29日は+15', () => {
    expect(getStreakBonus(14)).toBe(15)
    expect(getStreakBonus(29)).toBe(15)
  })

  it('30日以上は+20', () => {
    expect(getStreakBonus(30)).toBe(20)
    expect(getStreakBonus(100)).toBe(20)
  })
})

describe('XP_VALUES', () => {
  it('全12アクションタイプにXP値が定義されている', () => {
    const actionTypes = [
      'LOGIN', 'STOCK_ADD', 'MEMO_SAVE', 'TAG_ADD', 'PRICE_UPDATE',
      'POSITION_ADD', 'PORTFOLIO_SNAPSHOT', 'EVENT_REGISTER',
      'DIVIDEND_REGISTER', 'BENEFIT_REGISTER', 'NEXT_ACTION', 'FEEDBACK',
    ]
    for (const type of actionTypes) {
      expect(XP_VALUES[type as keyof typeof XP_VALUES]).toBeGreaterThan(0)
    }
  })

  it('全アクションの合計が日次上限以内で達成可能', () => {
    const totalPossible = Object.values(XP_VALUES).reduce((sum, xp) => sum + xp, 0)
    expect(totalPossible).toBeGreaterThan(DAILY_XP_CAP)
  })
})

describe('XP_DESCRIPTIONS', () => {
  it('全アクションタイプに説明が定義されている', () => {
    for (const key of Object.keys(XP_VALUES)) {
      expect(XP_DESCRIPTIONS[key as keyof typeof XP_DESCRIPTIONS]).toBeTruthy()
    }
  })
})

describe('LEVEL_NAMES', () => {
  it('全20レベルに名称が定義されている', () => {
    for (let i = 1; i <= MAX_LEVEL; i++) {
      expect(LEVEL_NAMES[i]).toBeTruthy()
    }
  })
})

describe('DAILY_XP_CAP', () => {
  it('日次上限は100XP', () => {
    expect(DAILY_XP_CAP).toBe(100)
  })
})
