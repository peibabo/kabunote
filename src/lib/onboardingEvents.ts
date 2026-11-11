/**
 * オンボーディング計測
 *
 * ウィザードのどのステップで離脱したか、「さっそく始める」「あとで」「✕」の
 * どれで閉じたかを記録する。計測の失敗は UX に影響させない（送信エラーは握りつぶす）。
 */

export const ONBOARDING_EVENT_TYPES = ['shown', 'step_view', 'get_started', 'later', 'close'] as const;
export type OnboardingEventType = (typeof ONBOARDING_EVENT_TYPES)[number];

/** ステップ番号の上限（ウィザードのステップ数より少し余裕を持たせる） */
export const MAX_ONBOARDING_STEP = 9;

export function isValidOnboardingEvent(event: unknown, step: unknown): event is OnboardingEventType {
  return (
    typeof event === 'string' &&
    (ONBOARDING_EVENT_TYPES as readonly string[]).includes(event) &&
    Number.isInteger(step) &&
    (step as number) >= 0 &&
    (step as number) <= MAX_ONBOARDING_STEP
  );
}

/** イベントを送信する（fire-and-forget。ページ遷移中でも届くよう keepalive を付ける） */
export function trackOnboardingEvent(event: OnboardingEventType, step: number): void {
  if (typeof window === 'undefined') return;
  fetch('/api/onboarding/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, step }),
    keepalive: true,
  }).catch(() => {
    // 計測失敗はユーザー体験に影響させない
  });
}
