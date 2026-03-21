// 日付フォーマット関連のユーティリティ

import { formatDateJST } from '@/lib/dateJst';

/**
 * DateオブジェクトをJST基準の日付文字列（YYYY-MM-DD）に変換
 */
export const formatDateString = (date: Date): string => {
  return formatDateJST(date);
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
