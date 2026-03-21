import { describe, it, expect } from 'vitest'
import {
  isTSENewYearHoliday,
  isJPHoliday,
  isTSEBusinessDay,
  getPreviousBusinessDay,
  getPreviousBusinessDayStr,
  isTSEBusinessDayStr,
} from '@/lib/jpBusinessDay'

describe('isTSENewYearHoliday', () => {
  it('12/31は休場', () => {
    expect(isTSENewYearHoliday(new Date(2026, 11, 31))).toBe(true)
  })

  it('1/1は休場', () => {
    expect(isTSENewYearHoliday(new Date(2026, 0, 1))).toBe(true)
  })

  it('1/2は休場', () => {
    expect(isTSENewYearHoliday(new Date(2026, 0, 2))).toBe(true)
  })

  it('1/3は休場', () => {
    expect(isTSENewYearHoliday(new Date(2026, 0, 3))).toBe(true)
  })

  it('1/4は休場ではない', () => {
    expect(isTSENewYearHoliday(new Date(2026, 0, 4))).toBe(false)
  })

  it('12/30は休場ではない', () => {
    expect(isTSENewYearHoliday(new Date(2026, 11, 30))).toBe(false)
  })
})

describe('isJPHoliday', () => {
  it('元日(1/1)は祝日', () => {
    expect(isJPHoliday(new Date(2026, 0, 1))).toBe(true)
  })

  it('建国記念の日(2/11)は祝日', () => {
    expect(isJPHoliday(new Date(2026, 1, 11))).toBe(true)
  })

  it('天皇誕生日(2/23)は祝日', () => {
    expect(isJPHoliday(new Date(2026, 1, 23))).toBe(true)
  })

  it('通常の平日は祝日ではない', () => {
    // 2026/3/10 火曜日
    expect(isJPHoliday(new Date(2026, 2, 10))).toBe(false)
  })
})

describe('isTSEBusinessDay', () => {
  it('通常の平日は営業日', () => {
    // 2026/3/9 月曜日
    expect(isTSEBusinessDay(new Date(2026, 2, 9))).toBe(true)
  })

  it('土曜は非営業日', () => {
    // 2026/3/7 土曜日
    expect(isTSEBusinessDay(new Date(2026, 2, 7))).toBe(false)
  })

  it('日曜は非営業日', () => {
    // 2026/3/8 日曜日
    expect(isTSEBusinessDay(new Date(2026, 2, 8))).toBe(false)
  })

  it('祝日は非営業日', () => {
    // 2026/1/1 元日（木曜日）
    expect(isTSEBusinessDay(new Date(2026, 0, 1))).toBe(false)
  })

  it('12/31は非営業日（平日でも東証休場）', () => {
    // 2025/12/31 水曜日
    expect(isTSEBusinessDay(new Date(2025, 11, 31))).toBe(false)
  })

  it('1/4が平日なら営業日', () => {
    // 2027/1/4 月曜日
    expect(isTSEBusinessDay(new Date(2027, 0, 4))).toBe(true)
  })
})

describe('isTSEBusinessDayStr', () => {
  it('YYYY-MM-DD文字列で判定できる', () => {
    expect(isTSEBusinessDayStr('2026-03-09')).toBe(true)  // 月曜
    expect(isTSEBusinessDayStr('2026-03-07')).toBe(false)  // 土曜
  })
})

describe('getPreviousBusinessDay', () => {
  it('火曜の前営業日は月曜', () => {
    // 2026/3/10 火曜
    const result = getPreviousBusinessDay(new Date(2026, 2, 10))
    expect(result.getDate()).toBe(9)
    expect(result.getDay()).toBe(1) // 月曜
  })

  it('月曜の前営業日は前週金曜', () => {
    // 2026/3/9 月曜
    const result = getPreviousBusinessDay(new Date(2026, 2, 9))
    expect(result.getDate()).toBe(6)
    expect(result.getDay()).toBe(5) // 金曜
  })

  it('祝日翌日の前営業日は祝日前の営業日', () => {
    // 2026/2/12 木曜 → 2/11は建国記念の日 → 前営業日は2/10(火)
    const result = getPreviousBusinessDay(new Date(2026, 1, 12))
    expect(result.getDate()).toBe(10)
  })

  it('年始の前営業日は前年12/30', () => {
    // 2026/1/5 月曜: 1/4日曜, 1/3土曜(+休場), 1/2金曜(休場), 1/1木曜(祝日+休場), 12/31水曜(休場) → 12/30(火)
    const result = getPreviousBusinessDay(new Date(2026, 0, 5))
    expect(result.getMonth()).toBe(11) // 12月
    expect(result.getDate()).toBe(30)
  })

  it('GWを跨ぐ場合', () => {
    // 2026/5/7 木曜: 5/6水曜(振替休日), 5/5火曜(こどもの日), 5/4月曜(みどりの日) → 5/1(金)
    const result = getPreviousBusinessDay(new Date(2026, 4, 7))
    expect(result.getMonth()).toBe(4) // 5月
    expect(result.getDate()).toBe(1)
  })
})

describe('getPreviousBusinessDayStr', () => {
  it('YYYY-MM-DD形式で返す', () => {
    // 2026/3/10 火曜 → 前営業日は3/9 月曜
    expect(getPreviousBusinessDayStr('2026-03-10')).toBe('2026-03-09')
  })

  it('月曜の前営業日は前週金曜', () => {
    expect(getPreviousBusinessDayStr('2026-03-09')).toBe('2026-03-06')
  })

  it('年末年始を跨ぐ', () => {
    expect(getPreviousBusinessDayStr('2026-01-05')).toBe('2025-12-30')
  })
})
