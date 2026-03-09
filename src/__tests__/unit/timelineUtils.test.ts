import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getEventStyle, shouldShowDateLabel, getEventDotColor } from '@/utils/timelineUtils'

describe('getEventStyle', () => {
  it('earningsイベントのスタイル', () => {
    const style = getEventStyle('earnings', false, 10)
    expect(style.color).toBe('bg-red-500')
    expect(style.priority).toBe(3)
  })

  it('過去のイベントは透明度が低い', () => {
    const style = getEventStyle('earnings', true, -5)
    expect(style.opacity).toBe('opacity-40')
    expect(style.animation).toBe('')
  })

  it('直近7日のイベントはanimate-pulse', () => {
    const style = getEventStyle('earnings', false, 3)
    expect(style.opacity).toBe('opacity-100')
    expect(style.animation).toBe('animate-pulse')
  })

  it('7日より先のイベント', () => {
    const style = getEventStyle('dividend-rights-last', false, 20)
    expect(style.opacity).toBe('opacity-80')
    expect(style.animation).toBe('')
  })

  it('shareholder-meetingのスタイル', () => {
    const style = getEventStyle('shareholder-meeting', false, 10)
    expect(style.color).toBe('bg-blue-500')
    expect(style.priority).toBe(1)
  })
})

describe('shouldShowDateLabel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-08'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('今日はtrueを返す', () => {
    expect(shouldShowDateLabel(new Date('2026-03-08'), 0)).toBe(true)
  })

  it('月の1日はtrueを返す', () => {
    expect(shouldShowDateLabel(new Date('2026-04-01'), 5)).toBe(true)
  })

  it('月曜日かつindex%7===0の場合true', () => {
    // 2026-03-09は月曜日
    expect(shouldShowDateLabel(new Date('2026-03-09'), 7)).toBe(true)
  })

  it('該当しない日はfalse', () => {
    // 2026-03-10は火曜日
    expect(shouldShowDateLabel(new Date('2026-03-10'), 2)).toBe(false)
  })
})

describe('getEventDotColor', () => {
  it('earningsは赤', () => {
    expect(getEventDotColor('earnings')).toBe('bg-red-500')
  })

  it('dividend-rights-lastは緑', () => {
    expect(getEventDotColor('dividend-rights-last')).toBe('bg-green-400')
  })

  it('shareholder-rights-confirmationは紫', () => {
    expect(getEventDotColor('shareholder-rights-confirmation')).toBe('bg-purple-600')
  })

  it('shareholder-meetingは青', () => {
    expect(getEventDotColor('shareholder-meeting')).toBe('bg-blue-500')
  })

  it('不明なタイプはグレー', () => {
    // @ts-expect-error テスト用に不正な型を渡す
    expect(getEventDotColor('unknown')).toBe('bg-gray-400')
  })
})
