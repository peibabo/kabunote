/**
 * アプリ内カスタムイベントの一元管理
 *
 * `storageKeys.ts` の姉妹ファイル。DB更新をまたいだコンポーネント間の再描画を
 * `window` のカスタムイベントで伝えているため、イベント名と detail の型をここに集約する。
 *
 * 生の文字列で dispatch すると typo がサイレントに無視される（リスナーが反応しないだけで
 * エラーにならない）ため、必ず `APP_EVENTS` 経由で `emitAppEvent` / `useAppEvent` を使うこと。
 */

import type { StockData } from '@/types/stock';
import type { XpGrantResult } from '@/types/gamification';
import type { TitleStatus } from '@/types/titles';
import type { ExternalLink } from '@/lib/defaultExternalLinks';
import type { StockLinkSetting } from '@/lib/stockExternalLinks';

// ─────────────────────────────────────────
// イベント名
// ─────────────────────────────────────────
export const APP_EVENTS = {
  /** 決算・株主総会・配当・優待の登録／更新（カレンダー再構築用） */
  DB_CALENDAR_UPDATE: 'kabunote-db-calendar-update',
  /** タグの追加／削除 */
  DB_TAG_UPDATE: 'kabunote-db-tag-update',
  /** 次の一手（Next Action Plan）の保存／削除 */
  DB_STRATEGY_UPDATE: 'kabunote-db-strategy-update',
  /** 保有ポジションの追加／更新／削除／売却 */
  DB_POSITION_UPDATE: 'kabunote-db-position-update',
  /** 現在値・利確目標・損切ラインの更新 */
  DB_PRICE_UPDATE: 'kabunote-db-price-update',
  /** 確定損益（売却記録）の追加／削除 */
  DB_REALIZED_UPDATE: 'kabunote-db-realized-update',

  /** ポートフォリオスナップショットの記録完了 */
  SNAPSHOT_CREATED: 'kabunote-snapshot-created',
  /** XP獲得 */
  XP_GAINED: 'kabunote-xp-gained',
  /** レベルアップ */
  LEVEL_UP: 'kabunote-level-up',
  /** 称号アンロック */
  TITLE_UNLOCKED: 'kabunote-title-unlocked',

  /** 余力現金・次の一手メモの更新 */
  CASH_UPDATE: 'kabunote-cash-update',
  /** 外部リンク設定の更新 */
  EXTERNAL_LINKS_UPDATE: 'kabunote-external-links-update',
  /** 銘柄リンク設定の更新 */
  STOCK_LINK_SETTINGS_UPDATE: 'kabunote-stock-link-settings-update',

  /** localStorage の書き込み（同一タブ内の他コンポーネントへ通知） */
  LOCAL_STORAGE_CHANGE: 'localStorageChange',
  /** Cookie同意状態の変更 */
  COOKIE_CONSENT_CHANGE: 'cookie-consent-change',
} as const;

export type AppEventName = (typeof APP_EVENTS)[keyof typeof APP_EVENTS];

// ─────────────────────────────────────────
// detail の型
// ─────────────────────────────────────────

/** カレンダー更新は種別で detail の形が変わる */
export type CalendarUpdateDetail =
  | {
      type: 'event';
      symbol: string;
      eventType: string;
      eventData: StockData['events'][0] | null;
    }
  | { type: 'dividend'; symbol: string; dividend: StockData['dividend'] }
  | { type: 'benefit'; symbol: string; benefit: StockData['benefit'] };

export interface CashUpdateDetail {
  cashAmount: string;
  nextActionMemo: string;
}

/**
 * イベント名 → detail の型のマップ。
 * `void` は detail を持たない（`new Event()` で発火する）イベント。
 */
export interface AppEventDetailMap {
  [APP_EVENTS.DB_CALENDAR_UPDATE]: CalendarUpdateDetail;
  [APP_EVENTS.DB_TAG_UPDATE]: { symbol: string; tags: StockData['tags'] };
  [APP_EVENTS.DB_STRATEGY_UPDATE]: { symbol: string; nextActionPlan: StockData['nextActionPlan'] };
  [APP_EVENTS.DB_POSITION_UPDATE]: { symbol: string; positions: StockData['positions'] };
  [APP_EVENTS.DB_PRICE_UPDATE]: {
    symbol: string;
    currentPrice: number | null;
    targetPrice: number | null;
    stopLossPrice: number | null;
  };
  [APP_EVENTS.DB_REALIZED_UPDATE]: { symbol?: string; stockId?: string };

  [APP_EVENTS.SNAPSHOT_CREATED]: void;
  [APP_EVENTS.XP_GAINED]: XpGrantResult;
  [APP_EVENTS.LEVEL_UP]: { level: number; levelName: string };
  [APP_EVENTS.TITLE_UNLOCKED]: TitleStatus;

  [APP_EVENTS.CASH_UPDATE]: CashUpdateDetail;
  [APP_EVENTS.EXTERNAL_LINKS_UPDATE]: ExternalLink[];
  [APP_EVENTS.STOCK_LINK_SETTINGS_UPDATE]: StockLinkSetting[];

  /** value は「キーが変わった」ことだけ伝える発火元（useSnooze 等）では省略される */
  [APP_EVENTS.LOCAL_STORAGE_CHANGE]: { key: string; value?: unknown };
  [APP_EVENTS.COOKIE_CONSENT_CHANGE]: void;
}

// ─────────────────────────────────────────
// 発火
// ─────────────────────────────────────────

/** detail を持たないイベント名 */
export type VoidAppEventName = {
  [K in keyof AppEventDetailMap]: AppEventDetailMap[K] extends void ? K : never;
}[keyof AppEventDetailMap];

/** detail を持つイベント名 */
export type DetailedAppEventName = Exclude<keyof AppEventDetailMap, VoidAppEventName>;

/**
 * アプリ内イベントを発火する（SSR時は何もしない）。
 * detail を持たないイベントは第2引数を省略する。
 */
export function emitAppEvent<K extends VoidAppEventName>(name: K): void;
export function emitAppEvent<K extends DetailedAppEventName>(
  name: K,
  detail: AppEventDetailMap[K]
): void;
export function emitAppEvent(name: string, detail?: unknown): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    detail === undefined ? new Event(name) : new CustomEvent(name, { detail })
  );
}
