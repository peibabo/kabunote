/**
 * 数値入力のバリデーションユーティリティ
 * Infinity, NaN, 極端な値を防ぐ
 */

const MAX_PRICE = 99_999_999;    // 株価・金額の上限（1億未満）
const MAX_SHARES = 99_999_999;   // 株数の上限
const MAX_MONTH = 12;
const MIN_MONTH = 1;
const MAX_DAY = 31;
const MIN_DAY = 1;
const MAX_FREQUENCY = 12;        // 配当頻度の上限（月次）
const MAX_CASH = 99_999_999_999; // 現金残高の上限（1000億未満）

/** 数値が有限かつ範囲内かチェック（null/undefinedは許可） */
export function isValidOptionalNumber(
  value: unknown,
  min: number,
  max: number
): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === 'number' && isFinite(value) && value >= min && value <= max;
}

/** 必須の正の数値チェック */
export function isValidRequiredPositiveNumber(
  value: unknown,
  max: number
): boolean {
  return typeof value === 'number' && isFinite(value) && value > 0 && value <= max;
}

/** 株価（現在値・目標・損切）のバリデーション */
export function isValidPrice(value: unknown): boolean {
  return isValidOptionalNumber(value, 0, MAX_PRICE);
}

/** 必須の株価バリデーション（0より大きい） */
export function isValidRequiredPrice(value: unknown): boolean {
  return isValidRequiredPositiveNumber(value, MAX_PRICE);
}

/** 株数バリデーション（必須・正の数） */
export function isValidRequiredShares(value: unknown): boolean {
  return isValidRequiredPositiveNumber(value, MAX_SHARES);
}

/** 任意の株数バリデーション */
export function isValidOptionalShares(value: unknown): boolean {
  return isValidOptionalNumber(value, 0, MAX_SHARES);
}

/** 月バリデーション（1〜12、null許可） */
export function isValidMonth(value: unknown): boolean {
  return isValidOptionalNumber(value, MIN_MONTH, MAX_MONTH);
}

/** 日バリデーション（1〜31、null許可） */
export function isValidDay(value: unknown): boolean {
  return isValidOptionalNumber(value, MIN_DAY, MAX_DAY);
}

/** 配当頻度バリデーション */
export function isValidFrequency(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  return typeof value === 'number' && isFinite(value) && value >= 1 && value <= MAX_FREQUENCY && Number.isInteger(value);
}

/** 現金残高バリデーション（文字列で受け取り） */
export function isValidCashAmount(value: string): boolean {
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num) && num >= 0 && num <= MAX_CASH;
}

// --- 外部リンクバリデーション ---
const MAX_EXTERNAL_LINKS = 8;
const MAX_LINK_LABEL_LENGTH = 30;
const MAX_LINK_ICON_LENGTH = 4;
const MAX_LINK_URL_LENGTH = 2000;

/** 外部リンクURLバリデーション（http/httpsのみ） */
export function isValidExternalLinkUrl(value: string): boolean {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_LINK_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 外部リンクラベルバリデーション */
export function isValidExternalLinkLabel(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_LINK_LABEL_LENGTH;
}

/** 外部リンクアイコンバリデーション */
export function isValidExternalLinkIcon(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_LINK_ICON_LENGTH;
}

/** 外部リンク個数バリデーション */
export function isValidExternalLinksCount(count: number): boolean {
  return Number.isInteger(count) && count >= 0 && count <= MAX_EXTERNAL_LINKS;
}
