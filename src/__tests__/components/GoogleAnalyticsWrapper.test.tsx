import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import { act } from 'react'
import GoogleAnalyticsWrapper from '@/components/layout/GoogleAnalyticsWrapper'
import { STORAGE_KEYS } from '@/lib/storageKeys'

// GoogleAnalytics コンポーネントをモック
vi.mock('@next/third-parties/google', () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <div data-testid="google-analytics" data-ga-id={gaId} />
  ),
}))

describe('GoogleAnalyticsWrapper', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('同意済みの場合、GA4がレンダリングされる', () => {
    localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, 'granted')
    const { container } = render(<GoogleAnalyticsWrapper gaId="G-TEST123" />)
    expect(container.querySelector('[data-testid="google-analytics"]')).toBeInTheDocument()
  })

  it('未同意の場合、GA4がレンダリングされない', () => {
    const { container } = render(<GoogleAnalyticsWrapper gaId="G-TEST123" />)
    expect(container.querySelector('[data-testid="google-analytics"]')).not.toBeInTheDocument()
  })

  it('拒否済みの場合、GA4がレンダリングされない', () => {
    localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, 'denied')
    const { container } = render(<GoogleAnalyticsWrapper gaId="G-TEST123" />)
    expect(container.querySelector('[data-testid="google-analytics"]')).not.toBeInTheDocument()
  })

  it('カスタムイベント発火後にリアクティブに更新される', () => {
    const { container } = render(<GoogleAnalyticsWrapper gaId="G-TEST123" />)
    expect(container.querySelector('[data-testid="google-analytics"]')).not.toBeInTheDocument()

    // 同意状態を変更してイベント発火
    act(() => {
      localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, 'granted')
      window.dispatchEvent(new Event('cookie-consent-change'))
    })

    expect(container.querySelector('[data-testid="google-analytics"]')).toBeInTheDocument()
  })
})
