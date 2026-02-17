// 投資カレンダーの型定義

export interface InvestmentEvent {
  id: string;
  symbol: string;
  companyName: string;
  date: string; // YYYY-MM-DD format
  type: 'earnings' | 'dividend-rights-last' | 'dividend-rights-confirmation' | 'shareholder-rights-last' | 'shareholder-rights-confirmation' | 'shareholder-meeting';
  title: string;
  isRecurring?: boolean;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD format
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: InvestmentEvent[];
}

export interface EventSummary {
  [dateKey: string]: InvestmentEvent[];
}

// 営業日計算のユーティリティ（既存のものを流用）
export const calculateBusinessDaysBefore = (date: Date, businessDays: number): Date => {
  const result = new Date(date);
  let remainingDays = businessDays;

  while (remainingDays > 0) {
    result.setDate(result.getDate() - 1);
    const dayOfWeek = result.getDay();
    // 土曜日(6)と日曜日(0)以外の場合にカウント
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }

  return result;
};

// 権利付き最終日を計算
export const calculateRightsLastDate = (rightsConfirmationDate: Date): Date => {
  return calculateBusinessDaysBefore(rightsConfirmationDate, 2);
};

// 日付文字列をフォーマット
export const formatDateString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 月/日から現在年または翌年の完全な日付を計算
export const calculateFullDateFromMonthDay = (month: number, day: number, isRecurring: boolean = true): Date => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // 今年の日付を作成
  let targetDate = new Date(currentYear, month - 1, day);

  // 毎年繰り返しの場合、現在日より過去なら翌年に設定
  if (isRecurring && targetDate < currentDate) {
    targetDate = new Date(currentYear + 1, month - 1, day);
  }

  return targetDate;
};