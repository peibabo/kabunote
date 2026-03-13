import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  SNOOZE_DURATIONS,
  generateAlertKey,
  getSnoozeDurationLabel,
  getTimeUntilUnsnooze,
} from '@/lib/snoozeCalc'

describe('SNOOZE_DURATIONS', () => {
  it('6つの期間オプションがある', () => {
    expect(SNOOZE_DURATIONS).toHaveLength(6)
  })

  it('各オプションにvalue/label/iconがある', () => {
    SNOOZE_DURATIONS.forEach(option => {
      expect(option).toHaveProperty('value')
      expect(option).toHaveProperty('label')
      expect(option).toHaveProperty('icon')
    })
  })

  it('値が昇順に並んでいる', () => {
    for (let i = 1; i < SNOOZE_DURATIONS.length; i++) {
      expect(SNOOZE_DURATIONS[i].value).toBeGreaterThan(SNOOZE_DURATIONS[i - 1].value)
    }
  })
})

describe('generateAlertKey', () => {
  it('symbol-alertType形式のキーを生成する', () => {
    expect(generateAlertKey('5027', 'stop-loss-exceeded')).toBe('5027-stop-loss-exceeded')
  })

  it('空文字でも動作する', () => {
    expect(generateAlertKey('', '')).toBe('-')
  })
})

describe('getSnoozeDurationLabel', () => {
  it('15分の場合', () => {
    const label = getSnoozeDurationLabel(15)
    expect(label).toContain('15分')
  })

  it('1440分(24時間)の場合', () => {
    const label = getSnoozeDurationLabel(1440)
    expect(label).toContain('24時間')
  })

  it('10080分(1週間)の場合', () => {
    const label = getSnoozeDurationLabel(10080)
    expect(label).toContain('1週間')
  })
})

describe('getTimeUntilUnsnooze', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08T10:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('期限切れの場合', () => {
    const pastTime = Date.now() - 1000
    expect(getTimeUntilUnsnooze(pastTime)).toBe('期限切れ')
  })

  it('30分後の場合', () => {
    const futureTime = Date.now() + 30 * 60 * 1000
    expect(getTimeUntilUnsnooze(futureTime)).toBe('30分後')
  })

  it('2時間30分後の場合', () => {
    const futureTime = Date.now() + (2 * 60 + 30) * 60 * 1000
    expect(getTimeUntilUnsnooze(futureTime)).toBe('2時間30分後')
  })

  it('ちょうど3時間後の場合', () => {
    const futureTime = Date.now() + 3 * 60 * 60 * 1000
    expect(getTimeUntilUnsnooze(futureTime)).toBe('3時間後')
  })

  it('1日12時間後の場合', () => {
    const futureTime = Date.now() + (24 + 12) * 60 * 60 * 1000
    expect(getTimeUntilUnsnooze(futureTime)).toBe('1日12時間後')
  })

  it('ちょうど2日後の場合', () => {
    const futureTime = Date.now() + 2 * 24 * 60 * 60 * 1000
    expect(getTimeUntilUnsnooze(futureTime)).toBe('2日後')
  })
})
