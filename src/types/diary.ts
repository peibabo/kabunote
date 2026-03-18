/** ニュースアイテム */
export interface NewsItem {
  id?: string
  url: string
  comment: string
}

/** 投資日記データ */
export interface DiaryData {
  marketOverview: string
  newsMemo: string
  newsItems: NewsItem[]
  reflection: string
  tomorrowFocus: string
}

/** テキストフィールドのキー（newsItems以外） */
export type DiaryTextField = 'marketOverview' | 'newsMemo' | 'reflection' | 'tomorrowFocus'

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

/** ニュース一覧アイテム（日記） */
export interface NewsListItem {
  id: string
  url: string
  comment: string
  diaryDate: string
  createdAt: string
  source?: 'diary' | 'stock'
}

/** ニュース一覧アイテム（銘柄） */
export interface StockNewsListItem {
  id: string
  url: string
  comment: string
  symbol: string
  stockName: string | null
  createdAt: string
  source: 'stock'
}

/** 統合ニュース一覧アイテム */
export type UnifiedNewsItem = (NewsListItem & { source: 'diary' }) | StockNewsListItem

/** APIレスポンス: ニュース一覧 */
export interface NewsListResponse {
  items: (NewsListItem | UnifiedNewsItem)[]
  total: number
}
