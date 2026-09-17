import { describe, it, expect } from 'vitest'
import {
  formatMonthDay,
  formatDateLabel,
  formatDateYMDJP,
  formatDateJP,
  formatDateSlashJP,
  formatMonthDayJP,
  getWeekdayJP,
  WEEKDAYS_JP,
} from '@/lib/dateFormat'

describe('formatMonthDay', () => {
  it('YYYY-MM-DD形式をM/D形式に変換', () => {
    expect(formatMonthDay('2026-03-08')).toBe('3/8')
  })

  it('2桁月日も正しく変換', () => {
    expect(formatMonthDay('2026-12-25')).toBe('12/25')
  })

  it('空文字列の場合は"-"を返す', () => {
    expect(formatMonthDay('')).toBe('-')
  })

  it('1月1日を正しく変換', () => {
    expect(formatMonthDay('2026-01-01')).toBe('1/1')
  })
})

describe('formatDateLabel', () => {
  it('YYYY-MM-DD を M/D 形式に変換する', () => {
    expect(formatDateLabel('2024-06-15')).toBe('6/15')
    expect(formatDateLabel('2024-01-01')).toBe('1/1')
    expect(formatDateLabel('2024-12-31')).toBe('12/31')
  })

  it('0埋めされた月日のゼロを落とす', () => {
    expect(formatDateLabel('2026-03-08')).toBe('3/8')
  })
})

describe('formatDateYMDJP', () => {
  it('YYYY年M月D日 形式に変換する', () => {
    expect(formatDateYMDJP('2026-03-08')).toBe('2026年3月8日')
    expect(formatDateYMDJP('2026-12-25')).toBe('2026年12月25日')
  })

  // 回帰: Recharts のペイロード経由で非文字列が渡ってもクラッシュしない
  it('非文字列が渡ってもクラッシュせず文字列化して返す', () => {
    expect(formatDateYMDJP(12345 as unknown as string)).toBe('12345')
    expect(formatDateYMDJP(null as unknown as string)).toBe('')
    expect(formatDateYMDJP(undefined as unknown as string)).toBe('')
  })
})

describe('formatDateJP', () => {
  it('YYYY年M月D日（曜）形式に変換する', () => {
    // 2026-03-08 は日曜日
    expect(formatDateJP('2026-03-08')).toBe('2026年3月8日（日）')
    // 2026-12-25 は金曜日
    expect(formatDateJP('2026-12-25')).toBe('2026年12月25日（金）')
  })

  it('1桁の月日のゼロを落とす', () => {
    // 2026-01-01 は木曜日
    expect(formatDateJP('2026-01-01')).toBe('2026年1月1日（木）')
  })

  it('年をまたぐ日付も正しく扱う', () => {
    // 2025-12-31 は水曜日
    expect(formatDateJP('2025-12-31')).toBe('2025年12月31日（水）')
  })
})

describe('formatDateSlashJP', () => {
  it('YYYY/M/D（曜）形式に変換する', () => {
    expect(formatDateSlashJP('2026-03-08')).toBe('2026/3/8（日）')
    expect(formatDateSlashJP('2026-01-01')).toBe('2026/1/1（木）')
  })
})

describe('formatMonthDayJP', () => {
  it('M/D（曜）形式に変換する', () => {
    expect(formatMonthDayJP('2026-03-08')).toBe('3/8（日）')
    expect(formatMonthDayJP('2026-12-25')).toBe('12/25（金）')
  })
})

describe('getWeekdayJP', () => {
  it('日付文字列から曜日ラベルを返す', () => {
    expect(getWeekdayJP('2026-03-08')).toBe('日')
    expect(getWeekdayJP('2026-03-09')).toBe('月')
    expect(getWeekdayJP('2026-03-14')).toBe('土')
  })

  it('WEEKDAYS_JPは日曜始まりの7要素', () => {
    expect(WEEKDAYS_JP).toEqual(['日', '月', '火', '水', '木', '金', '土'])
  })
})
