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
    const result = calculateRightsDateFromSettings(settings)
    expect(result).toBe('2026-06-30')
  })

  it('recurring=trueで過去の場合は翌年に設定', () => {
    const settings = createRightsDateSettings({ month: 1, day: 15, isRecurring: true })
    expect(calculateRightsDateFromSettings(settings)).toBe('2027-01-15')
  })

  it('recurring=falseの場合は今年のまま', () => {
    const settings = createRightsDateSettings({ month: 1, day: 15, isRecurring: false })
    expect(calculateRightsDateFromSettings(settings)).toBe('2026-01-15')
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
