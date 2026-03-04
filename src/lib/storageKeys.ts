/**
 * localStorage キー定数の一元管理
 *
 * グローバルキー（銘柄コード不要）と
 * 銘柄固有キー（銘柄コードを引数に取る関数形式）を提供する
 */

// ─────────────────────────────────────────
// グローバル固定キー
// ─────────────────────────────────────────
export const STORAGE_KEYS = {
  /** 銘柄シンボル配列（並び順込み） */
  STOCKS: 'kabunote-stocks',
  /** 銘柄並び順（別保存） */
  STOCKS_ORDER: 'kabunote-stocks-order',
  /** お気に入りグループ一覧 */
  FAVORITE_GROUPS: 'kabunote-favorite-groups',
  /** 選択中のグループフィルター */
  SELECTED_GROUP_FILTER: 'kabunote-selected-group-filter',
  /** 投資余力現金残高 */
  CASH_AMOUNT: 'kabunote-cash-amount',
  /** Next Actionメモ */
  NEXT_ACTION_MEMO: 'kabunote-next-action-memo',
  /** スヌーズ中アラート一覧 */
  SNOOZED_ALERTS: 'kabunote-snoozed-alerts',
  /** タイムラインのカレンダーアコーディオン展開状態 */
  TIMELINE_CALENDAR_EXPANDED: 'kabunote-timeline-calendar-expanded',
} as const;

// ─────────────────────────────────────────
// 銘柄固有キー生成関数
// ─────────────────────────────────────────
export const stockKey = {
  /** 株ノオト */
  memo: (symbol: string) => `kabunote-memo-${symbol}`,
  /** 現在株価 */
  currentPrice: (symbol: string) => `kabunote-current-price-${symbol}`,
  /** 利確目標株価 */
  targetPrice: (symbol: string) => `kabunote-target-price-${symbol}`,
  /** 損切りライン */
  stopLoss: (symbol: string) => `kabunote-stop-loss-${symbol}`,
  /** 保有ポジション一覧 */
  positions: (symbol: string) => `kabunote-positions-${symbol}`,
  /** タグ一覧 */
  tags: (symbol: string) => `kabunote-tags-${symbol}`,
  /** 配当額/株 */
  dividendPerShare: (symbol: string) => `kabunote-dividend-per-share-${symbol}`,
  /** 配当頻度 */
  dividendFrequency: (symbol: string) => `kabunote-dividend-frequency-${symbol}`,
  /** 配当権利確定日設定 */
  dividendRightsSettings: (symbol: string) => `kabunote-dividend-rights-settings-${symbol}`,
  /** 優待内容 */
  benefitDescription: (symbol: string) => `kabunote-benefit-description-${symbol}`,
  /** 優待最低株数 */
  minimumShares: (symbol: string) => `kabunote-minimum-shares-${symbol}`,
  /** 優待推定価値 */
  estimatedValue: (symbol: string) => `kabunote-estimated-value-${symbol}`,
  /** 優待権利確定日設定 */
  shareholderRightsSettings: (symbol: string) => `kabunote-shareholder-rights-settings-${symbol}`,
  /** 決算発表日 */
  earningsDate: (symbol: string) => `kabunote-earnings-date-${symbol}`,
  /** 株主総会日 */
  shareholderMeeting: (symbol: string) => `kabunote-shareholder-meeting-${symbol}`,
  /** Next Action Plan (単一オブジェクト保存時のキー) */
  nextActionPlan: (symbol: string) => `kabunote-next-action-plan-${symbol}`,
  /** Next Action Plan フィールド別キー (useNextActionPlan hook 用) */
  nextActionPlanField: (symbol: string, field: string) => `kabunote-next-action-plan-${symbol}-${field}`,
  /** 権利確定日設定（レガシー：RightsDateSettings） */
  rightsSettings: (symbol: string) => `kabunote-rights-settings-${symbol}`,
  /** アクティブタブ */
  activeTab: (symbol: string) => `kabunote-active-tab-${symbol}`,
  /** 外部からのタブ切り替え指示 */
  openTab: (symbol: string) => `kabunote-open-tab-${symbol}`,
  /** 投資戦略タブのサブタブ状態 */
  investmentTab: (symbol: string) => `kabunote-investment-tab-${symbol}`,
  /** 管理タブのサブタブ状態 */
  managementTab: (symbol: string) => `kabunote-management-tab-${symbol}`,
} as const;
