// JST（日本標準時）基準の日付ユーティリティ
// サーバー（UTC）・クライアント（JST）両対応

const JST_OFFSET_MIN = 9 * 60

/** 任意のDateオブジェクトをJST基準のDateに変換（年月日・時分秒のみ正確） */
function toJSTDate(date: Date): Date {
  return new Date(date.getTime() + (JST_OFFSET_MIN + date.getTimezoneOffset()) * 60000)
}

/** JST基準で今日の日付をYYYY-MM-DD形式で取得 */
export function getTodayJST(): string {
  return formatDateJST(new Date())
}

/** YYYY-MM-DD が JST基準で「昨日以前」か（当日・未来は false）。過去スナップショットの編集可否判定に使用 */
export function isBeforeTodayJST(dateStr: string): boolean {
  return dateStr < getTodayJST()
}

/** JST基準でn日前の日付をYYYY-MM-DD形式で取得 */
export function getJSTDateDaysAgo(daysAgo: number): string {
  const now = new Date()
  const shifted = new Date(now.getTime() - daysAgo * 86400000)
  return formatDateJST(shifted)
}

/** DateオブジェクトをJST基準のYYYY-MM-DD文字列に変換 */
export function formatDateJST(date: Date): string {
  const jst = toJSTDate(date)
  return `${jst.getFullYear()}-${String(jst.getMonth() + 1).padStart(2, '0')}-${String(jst.getDate()).padStart(2, '0')}`
}

/** YYYY-MM-DD文字列をUTC midnight Dateに変換（Prismaクエリ用） */
export function dateStrToUTCMidnight(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00.000Z')
}

/** JST基準で現在の時（0-23）を返す */
export function getJSTHour(): number {
  return toJSTDate(new Date()).getHours()
}
