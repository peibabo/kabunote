/**
 * 東証(TSE)営業日判定ユーティリティ
 *
 * 東証の休場日:
 * - 土曜・日曜
 * - 日本の祝日（国民の祝日に関する法律）
 * - 12/31〜1/3（東証固有の年末年始休場）
 */
import holiday_jp from '@holiday-jp/holiday_jp'

/** 東証固有の年末年始休場日かどうか（12/31〜1/3） */
export function isTSENewYearHoliday(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return (month === 12 && day === 31) || (month === 1 && day <= 3)
}

/** 日本の祝日かどうか */
export function isJPHoliday(date: Date): boolean {
  return holiday_jp.isHoliday(date)
}

/** 東証の営業日かどうか */
export function isTSEBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return false
  if (isJPHoliday(date)) return false
  if (isTSENewYearHoliday(date)) return false
  return true
}

/** 指定日の前営業日を返す */
export function getPreviousBusinessDay(date: Date): Date {
  const result = new Date(date)
  do {
    result.setDate(result.getDate() - 1)
  } while (!isTSEBusinessDay(result))
  return result
}

/** YYYY-MM-DD文字列からローカルタイムのDateを生成（タイムゾーンに依存しない） */
function parseDateStr(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** 指定日(YYYY-MM-DD)の前営業日をYYYY-MM-DD文字列で返す */
export function getPreviousBusinessDayStr(dateStr: string): string {
  const prev = getPreviousBusinessDay(parseDateStr(dateStr))
  const year = prev.getFullYear()
  const month = String(prev.getMonth() + 1).padStart(2, '0')
  const day = String(prev.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 指定日(YYYY-MM-DD)が東証営業日かどうかを判定 */
export function isTSEBusinessDayStr(dateStr: string): boolean {
  return isTSEBusinessDay(parseDateStr(dateStr))
}
