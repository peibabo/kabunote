// 日付フォーマット関連のユーティリティ
//
// 日付文字列（YYYY-MM-DD）の表示用フォーマットはこのファイルに集約する。
// 各コンポーネントにローカル関数を定義しないこと（曜日配列やパース方法が分岐するため）。

/** 曜日ラベル（getDay() のインデックスに対応） */
export const WEEKDAYS_JP = ['日', '月', '火', '水', '木', '金', '土'] as const;

/**
 * YYYY-MM-DD をローカル日付として解釈する。
 * `new Date('2026-03-08')` は UTC 深夜として解釈されるため、
 * 曜日を扱う場合は必ずこちらを使う（JST 基準で日付がずれないようにする）。
 */
function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

/** 日付文字列（YYYY-MM-DD）の曜日ラベルを返す */
export const getWeekdayJP = (dateStr: string): string => {
  return WEEKDAYS_JP[parseLocalDate(dateStr).getDay()];
};

/**
 * 日付文字列（YYYY-MM-DD）を「M/D」形式にフォーマット
 * @param dateStr 日付文字列
 * @returns フォーマット済み文字列。空文字列の場合は '-' を返す
 */
export const formatMonthDay = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/**
 * 日付文字列（YYYY-MM-DD）を「M/D」形式にフォーマット（チャート軸ラベル用）
 *
 * `formatMonthDay` と違い Date を経由せず文字列を分解するため、
 * タイムゾーンの影響を受けない。空文字は想定しない。
 */
export const formatDateLabel = (dateStr: string): string => {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(m)}/${parseInt(d)}`;
};

/**
 * 日付文字列（YYYY-MM-DD）を「YYYY年M月D日」形式にフォーマット
 *
 * Recharts のペイロード経由で非文字列が渡りクラッシュした回帰があるため、
 * 型に反する値が来ても split せず文字列化して返す（ChartMemoModal のテスト参照）。
 */
export const formatDateYMDJP = (dateStr: string): string => {
  if (typeof dateStr !== 'string') return String(dateStr ?? '');
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
};

/** 日付文字列（YYYY-MM-DD）を「YYYY年M月D日（曜）」形式にフォーマット */
export const formatDateJP = (dateStr: string): string => {
  const d = parseLocalDate(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS_JP[d.getDay()]}）`;
};

/** 日付文字列（YYYY-MM-DD）を「YYYY/M/D（曜）」形式にフォーマット */
export const formatDateSlashJP = (dateStr: string): string => {
  const d = parseLocalDate(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS_JP[d.getDay()]}）`;
};

/** 日付文字列（YYYY-MM-DD）を「M/D（曜）」形式にフォーマット */
export const formatMonthDayJP = (dateStr: string): string => {
  const d = parseLocalDate(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS_JP[d.getDay()]}）`;
};
