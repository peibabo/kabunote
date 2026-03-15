export const CHECKLIST_ITEMS = [
  '保有銘柄の現在株価を更新した',
  'アラートを確認した',
  'Next Actionを見直した',
  '株ノオトを更新した',
] as const;

export type ChecklistItemIndex = 0 | 1 | 2 | 3;

export interface DailyChecklistRecord {
  date: string;           // "YYYY-MM-DD"
  checkedItems: number[]; // [0, 2, 3] 等
}

export interface ChecklistStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCompletedDays: number;
}
