/**
 * localStorage キー定数の一元管理
 *
 * UIのみの状態（タブ開閉・スヌーズ・フィルター等）を管理する
 * DBで管理するデータのキーはここに含めない
 */

// ─────────────────────────────────────────
// グローバル固定キー
// ─────────────────────────────────────────
export const STORAGE_KEYS = {
  /** 選択中のグループフィルター */
  SELECTED_GROUP_FILTER: 'kabunote-selected-group-filter',
  /** スヌーズ中アラート一覧 */
  SNOOZED_ALERTS: 'kabunote-snoozed-alerts',
  /** タイムラインのカレンダーアコーディオン展開状態 */
  TIMELINE_CALENDAR_EXPANDED: 'kabunote-timeline-calendar-expanded',
  /** 余力現金セクションのアコーディオン展開状態 */
  CASH_SECTION_EXPANDED: 'kabunote-cash-section-expanded',
} as const;

// ─────────────────────────────────────────
// 銘柄固有キー生成関数（UIのみ）
// ─────────────────────────────────────────
export const stockKey = {
  /** アクティブタブ */
  activeTab: (symbol: string) => `kabunote-active-tab-${symbol}`,
  /** 外部からのタブ切り替え指示 */
  openTab: (symbol: string) => `kabunote-open-tab-${symbol}`,
  /** 投資戦略タブのサブタブ状態 */
  investmentTab: (symbol: string) => `kabunote-investment-tab-${symbol}`,
  /** 管理タブのサブタブ状態 */
  managementTab: (symbol: string) => `kabunote-management-tab-${symbol}`,
} as const;
