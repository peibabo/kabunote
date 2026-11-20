/**
 * 銘柄カードのタブを外部から切り替えるヘルパー
 *
 * カードは localStorage のタブ状態を LOCAL_STORAGE_CHANGE イベント経由で監視しているため
 * （BulkTabSwitcher と同じ仕組み）、キーを書き換えて通知すればカード外からも切り替えられる。
 */

import { stockKey } from '@/lib/storageKeys';
import { safeSetItem } from '@/lib/safeStorage';
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents';

export type CardMainTab = 'basic' | 'analysis' | 'management';
export type CardManagementTab = 'positions' | 'events';

/** タブ切り替え後の再描画を待ってからフォーカスするまでの遅延 */
export const CARD_TAB_SWITCH_DELAY_MS = 150;

function setAndNotify(key: string, value: string) {
  safeSetItem(key, value);
  emitAppEvent(APP_EVENTS.LOCAL_STORAGE_CHANGE, { key });
}

export function switchCardTab(symbol: string, mainTab: CardMainTab, managementSubTab?: CardManagementTab) {
  setAndNotify(stockKey.activeTab(symbol), mainTab);
  if (managementSubTab) {
    setAndNotify(stockKey.managementTab(symbol), managementSubTab);
  }
}

/** 「分析」タブ → 「分析」サブタブ（現在の株価入力欄がある画面）へ切り替える */
export function switchToPriceInput(symbol: string) {
  switchCardTab(symbol, 'analysis');
  setAndNotify(stockKey.investmentTab(symbol), 'analysis');
}

/** 現在の株価入力欄にフォーカスする（入力欄が描画済みであること） */
export function focusPriceInput(symbol: string, options?: FocusOptions) {
  const input = document.getElementById(`current-price-${symbol}`);
  if (input instanceof HTMLInputElement) {
    input.focus(options);
    input.select();
  }
}
