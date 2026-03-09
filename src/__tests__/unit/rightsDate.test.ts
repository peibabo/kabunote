import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createDefaultRightsSettings,
  calculateRightsDateFromSettings,
  formatMonthDay,
  shouldDeactivateRights,
} from '@/types/rightsDate'
import { createRightsDateSettings } from '../helpers/mockFactories'

describe('createDefaultRightsSettings', () => {
  it('デフォルト値を返す', () => {
    const result = createDefaultRightsSettings()
    expect(result).toEqual({
      month: null,
      day: null,
      isRecurring: true,
      isActive: false,
    })
  })
})

describe('calculateRightsDateFromSettings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('非アクティブの場合空文字を返す', () => {
    const settings = createRightsDateSettings({ isActive: false })
    expect(calculateRightsDateFromSettings(settings)).toBe('')
  })

  it('month=nullの場合空文字を返す', () => {
    const settings = createRightsDateSettings({ month: null })
    expect(calculateRightsDateFromSettings(settings)).toBe('')
  })

  it('未来の日付はそのまま返す', () => {
    const settings = createRightsDateSettings({ month: 6, day: 30, isRecurring: true })
    // toISOString()はUTC基準のため、JSTの6/30がUTCでは6/29になる可能性
    const result = calculateRightsDateFromSettings(settings)
    // ローカル日付で6月30日を作成→UTC変換で1日ずれる場合がある
    const expected = new Date(2026, 5, 30).toISOString().split('T')[0]
    expect(result).toBe(expected)
  })

  it('recurring=trueで過去の場合は翌年に設定', () => {
    const settings = createRightsDateSettings({ month: 1, day: 15, isRecurring: true })
    const expected = new Date(2027, 0, 15).toISOString().split('T')[0]
    expect(calculateRightsDateFromSettings(settings)).toBe(expected)
  })

  it('recurring=falseの場合は今年のまま', () => {
    const settings = createRightsDateSettings({ month: 1, day: 15, isRecurring: false })
    const expected = new Date(2026, 0, 15).toISOString().split('T')[0]
    expect(calculateRightsDateFromSettings(settings)).toBe(expected)
  })
})

describe('formatMonthDay', () => {
  it('非アクティブの場合空文字を返す', () => {
    const settings = createRightsDateSettings({ isActive: false })
    expect(formatMonthDay(settings)).toBe('')
  })

  it('通常の場合月/日を返す', () => {
    const settings = createRightsDateSettings({ month: 3, day: 31, isActive: true })
    expect(formatMonthDay(settings)).toBe('3/31')
  })
})

describe('shouldDeactivateRights', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('非アクティブならfalse', () => {
    const settings = createRightsDateSettings({ isActive: false })
    expect(shouldDeactivateRights(settings)).toBe(false)
  })

  it('recurring=trueならfalse', () => {
    const settings = createRightsDateSettings({ isRecurring: true, month: 1, day: 1 })
    expect(shouldDeactivateRights(settings)).toBe(false)
  })

  it('単発で過去の場合true', () => {
    const settings = createRightsDateSettings({ isRecurring: false, month: 1, day: 15 })
    expect(shouldDeactivateRights(settings)).toBe(true)
  })

  it('単発で未来の場合false', () => {
    const settings = createRightsDateSettings({ isRecurring: false, month: 12, day: 31 })
    expect(shouldDeactivateRights(settings)).toBe(false)
  })
})
