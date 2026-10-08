/**
 * localStorage の安全なアクセサ
 *
 * ブラウザのCookie/サイトデータがブロックされている環境（Edgeの追跡防止・
 * サンドボックスiframe等）では `window.localStorage` の参照自体が
 * SecurityError を投げる。UI状態の保存はベストエフォートで良いため、
 * 例外を握りつぶして「保存なし」として振る舞う。
 */

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** 値を取得する。利用不可・未設定の場合は null */
export function safeGetItem(key: string): string | null {
  try {
    return getLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** 値を保存する。保存できたら true（利用不可・容量超過時は false） */
export function safeSetItem(key: string, value: string): boolean {
  const storage = getLocalStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** 値を削除する。利用不可の場合は何もしない */
export function safeRemoveItem(key: string): void {
  try {
    getLocalStorage()?.removeItem(key);
  } catch {
    // ignore
  }
}
