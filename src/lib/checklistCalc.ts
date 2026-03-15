import type { DailyChecklistRecord, ChecklistStreakInfo } from '@/types/checklist';

/** 1つでもチェックしていれば完了 */
export function isCompleted(checkedItems: number[]): boolean {
  return checkedItems.length > 0;
}

/** ローカル日付を YYYY-MM-DD 形式で返す */
export function getTodayDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 日付文字列を1日前に戻す */
function prevDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** ストリーク計算 */
export function calculateStreak(
  records: DailyChecklistRecord[],
  today: string
): ChecklistStreakInfo {
  if (records.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalCompletedDays: 0 };
  }

  // 完了日のSetを作成
  const completedDays = new Set<string>();
  for (const r of records) {
    if (isCompleted(r.checkedItems)) {
      completedDays.add(r.date);
    }
  }

  const totalCompletedDays = completedDays.size;

  // currentStreak: 今日から遡る。今日が未完了なら昨日から遡る
  let currentStreak = 0;
  let cursor = completedDays.has(today) ? today : prevDay(today);

  while (completedDays.has(cursor)) {
    currentStreak++;
    cursor = prevDay(cursor);
  }

  // longestStreak: 全日付を昇順ソートして最長連続を求める
  const sortedDays = Array.from(completedDays).sort();
  let longestStreak = 0;
  let streak = 0;

  for (let i = 0; i < sortedDays.length; i++) {
    if (i === 0) {
      streak = 1;
    } else {
      // 前日と連続かチェック
      const expected = prevDay(sortedDays[i]);
      if (expected === sortedDays[i - 1]) {
        streak++;
      } else {
        streak = 1;
      }
    }
    if (streak > longestStreak) {
      longestStreak = streak;
    }
  }

  return { currentStreak, longestStreak, totalCompletedDays };
}
