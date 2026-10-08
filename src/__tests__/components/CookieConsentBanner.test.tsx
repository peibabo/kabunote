import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CookieConsentBanner from '@/components/layout/CookieConsentBanner'
import { STORAGE_KEYS } from '@/lib/storageKeys'

// Next.js Link をシンプルな a タグとしてモック
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('同意状態が未設定の場合、バナーが表示される', () => {
    render(<CookieConsentBanner />)
    expect(screen.getByText(/Google Analyticsを使用しています/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '同意する' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '拒否する' })).toBeInTheDocument()
  })

  it('「同意する」ボタンでgrantedが保存されバナーが非表示になる', () => {
    render(<CookieConsentBanner />)
    fireEvent.click(screen.getByRole('button', { name: '同意する' }))

    expect(localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT)).toBe('granted')
    expect(screen.queryByText(/Google Analyticsを使用しています/)).not.toBeInTheDocument()
  })

  it('「拒否する」ボタンでdeniedが保存されバナーが非表示になる', () => {
    render(<CookieConsentBanner />)
    fireEvent.click(screen.getByRole('button', { name: '拒否する' }))

    expect(localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT)).toBe('denied')
    expect(screen.queryByText(/Google Analyticsを使用しています/)).not.toBeInTheDocument()
  })

  it('同意済みの場合、バナーが表示されない', () => {
    localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, 'granted')
    render(<CookieConsentBanner />)
    expect(screen.queryByText(/Google Analyticsを使用しています/)).not.toBeInTheDocument()
  })

  it('拒否済みの場合、バナーが表示されない', () => {
    localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, 'denied')
    render(<CookieConsentBanner />)
    expect(screen.queryByText(/Google Analyticsを使用しています/)).not.toBeInTheDocument()
  })

  it('プライバシーポリシーリンクが正しいhrefを持つ', () => {
    render(<CookieConsentBanner />)
    const link = screen.getByText('プライバシーポリシー')
    expect(link).toHaveAttribute('href', '/privacy')
  })

  it('同意・拒否時にカスタムイベントが発火する', () => {
    const handler = vi.fn()
    window.addEventListener('cookie-consent-change', handler)

    render(<CookieConsentBanner />)
    fireEvent.click(screen.getByRole('button', { name: '同意する' }))

    expect(handler).toHaveBeenCalledTimes(1)
    window.removeEventListener('cookie-consent-change', handler)
  })

  it('localStorageへのアクセスが拒否される環境でもクラッシュせずバナーを表示・操作できる', () => {
    const spy = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Access is denied for this document.', 'SecurityError')
    })
    try {
      render(<CookieConsentBanner />)
      expect(screen.getByText(/Google Analyticsを使用しています/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '同意する' }))
      expect(screen.queryByText(/Google Analyticsを使用しています/)).not.toBeInTheDocument()
    } finally {
      spy.mockRestore()
    }
  })
})
