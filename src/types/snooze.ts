/**
 * スヌーズ期間（分単位）
 */
export type SnoozeDuration = 15 | 30 | 60 | 180 | 1440 | 10080;

/**
 * スヌーズ中のアラート情報
 */
export interface SnoozedAlert {
  /** アラートを一意識別するキー（例: "5027-stop-loss-exceeded"） */
  alertKey: string;

  /** 銘柄コード */
  symbol: string;

  /** アラート種別 */
  alertType: AlertType;

  /** スヌーズ解除時刻（Unix timestamp） */
  snoozeUntil: number;

  /** スヌーズ開始時刻（Unix timestamp） */
  snoozedAt: number;

  /** スヌーズ期間（分） */
  duration: SnoozeDuration;

  /** 元のアラートデータ */
  originalAlert: {
    companyName: string;
    alertMessage: string;
    alertDetail: string;
    currentPrice: number;
    targetPrice?: number;
    stopLossPrice?: number;
  };

  /** スヌーズ理由（任意） */
  reason?: string;
}
