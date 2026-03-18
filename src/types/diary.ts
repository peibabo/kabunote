/** 投資日記の4セクション */
export interface DiaryData {
  marketOverview: string
  newsMemo: string
  reflection: string
  tomorrowFocus: string
}

/** APIレスポンス: 日記取得 */
export interface DiaryResponse extends DiaryData {
  id: string
  diaryDate: string
  updatedAt: string
}

/** APIレスポンス: 月の日記日付リスト */
export interface DiaryMonthResponse {
  dates: string[]
}

export type DiaryField = keyof DiaryData
