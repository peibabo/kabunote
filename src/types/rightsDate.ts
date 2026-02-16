// 権利確定日の設定型定義

export interface RightsDateSettings {
  month: number | null;       // 月（1-12）
  day: number | null;         // 日（1-31）
  isRecurring: boolean;       // 毎年繰り返しかどうか
  isActive: boolean;          // 設定が有効かどうか
}

// 配当権利確定日の設定型定義（既存の型と同様）
export interface DividendRightsSettings {
  month: number | null;       // 月（1-12）
  day: number | null;         // 日（1-31）
  isRecurring: boolean;       // 毎年繰り返しかどうか
  isActive: boolean;          // 設定が有効かどうか
}

// 株主優待権利確定日の設定型定義（既存の型と同様）
export interface ShareholderRightsSettings {
  month: number | null;       // 月（1-12）
  day: number | null;         // 日（1-31）
  isRecurring: boolean;       // 毎年繰り返しかどうか
  isActive: boolean;          // 設定が有効かどうか
}

// デフォルト値
export const createDefaultRightsSettings = (): RightsDateSettings => ({
  month: null,
  day: null,
  isRecurring: true,
  isActive: false
});

// 配当権利確定日のデフォルト値
export const createDefaultDividendRightsSettings = (): DividendRightsSettings => ({
  month: null,
  day: null,
  isRecurring: true,
  isActive: false
});

// 株主優待権利確定日のデフォルト値
export const createDefaultShareholderRightsSettings = (): ShareholderRightsSettings => ({
  month: null,
  day: null,
  isRecurring: true,
  isActive: false
});

// 月/日から完全な日付を計算する関数
export const calculateRightsDateFromSettings = (settings: RightsDateSettings): string => {
  if (!settings.isActive || settings.month === null || settings.day === null) {
    return '';
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // 今年の権利確定日を作成
  let targetDate = new Date(currentYear, settings.month - 1, settings.day);

  // 毎年繰り返しの場合、現在日より過去なら翌年に設定
  if (settings.isRecurring && targetDate < currentDate) {
    targetDate = new Date(currentYear + 1, settings.month - 1, settings.day);
  }

  return targetDate.toISOString().split('T')[0];
};

// 設定から表示用の月/日文字列を生成
export const formatMonthDay = (settings: RightsDateSettings): string => {
  if (!settings.isActive || settings.month === null || settings.day === null) {
    return '';
  }
  return `${settings.month}/${settings.day}`;
};

// 単発イベントが過去になった場合の自動無効化チェック
export const shouldDeactivateRights = (settings: RightsDateSettings): boolean => {
  if (!settings.isActive || settings.isRecurring || settings.month === null || settings.day === null) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const targetDate = new Date(currentYear, settings.month - 1, settings.day);

  return targetDate < currentDate;
};

// 配当権利確定日から完全な日付を計算する関数
export const calculateDividendRightsDateFromSettings = (settings: DividendRightsSettings): string => {
  if (!settings.isActive || settings.month === null || settings.day === null) {
    return '';
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // 今年の権利確定日を作成
  let targetDate = new Date(currentYear, settings.month - 1, settings.day);

  // 毎年繰り返しの場合、現在日より過去なら翌年に設定
  if (settings.isRecurring && targetDate < currentDate) {
    targetDate = new Date(currentYear + 1, settings.month - 1, settings.day);
  }

  return targetDate.toISOString().split('T')[0];
};

// 株主優待権利確定日から完全な日付を計算する関数
export const calculateShareholderRightsDateFromSettings = (settings: ShareholderRightsSettings): string => {
  if (!settings.isActive || settings.month === null || settings.day === null) {
    return '';
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  // 今年の権利確定日を作成
  let targetDate = new Date(currentYear, settings.month - 1, settings.day);

  // 毎年繰り返しの場合、現在日より過去なら翌年に設定
  if (settings.isRecurring && targetDate < currentDate) {
    targetDate = new Date(currentYear + 1, settings.month - 1, settings.day);
  }

  return targetDate.toISOString().split('T')[0];
};

// 配当設定から表示用の月/日文字列を生成
export const formatDividendMonthDay = (settings: DividendRightsSettings): string => {
  if (!settings.isActive || settings.month === null || settings.day === null) {
    return '';
  }
  return `${settings.month}/${settings.day}`;
};

// 株主優待設定から表示用の月/日文字列を生成
export const formatShareholderMonthDay = (settings: ShareholderRightsSettings): string => {
  if (!settings.isActive || settings.month === null || settings.day === null) {
    return '';
  }
  return `${settings.month}/${settings.day}`;
};

// 配当権利確定日の自動無効化チェック
export const shouldDeactivateDividendRights = (settings: DividendRightsSettings): boolean => {
  if (!settings.isActive || settings.isRecurring || settings.month === null || settings.day === null) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const targetDate = new Date(currentYear, settings.month - 1, settings.day);

  return targetDate < currentDate;
};

// 株主優待権利確定日の自動無効化チェック
export const shouldDeactivateShareholderRights = (settings: ShareholderRightsSettings): boolean => {
  if (!settings.isActive || settings.isRecurring || settings.month === null || settings.day === null) {
    return false;
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const targetDate = new Date(currentYear, settings.month - 1, settings.day);

  return targetDate < currentDate;
};