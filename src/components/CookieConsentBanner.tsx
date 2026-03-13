'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { STORAGE_KEYS } from '@/lib/storageKeys'

export default function CookieConsentBanner() {
  const [consent, setConsent] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT)
    setConsent(stored)
  }, [])

  const handleConsent = (value: 'granted' | 'denied') => {
    localStorage.setItem(STORAGE_KEYS.COOKIE_CONSENT, value)
    setConsent(value)
    window.dispatchEvent(new Event('cookie-consent-change'))
  }

  // SSR or already responded
  if (consent !== null) return null

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 bg-gray-800 border-t border-gray-700 px-4 py-4"
      style={{ animation: 'slideUp 0.3s ease-out' }}
      role="banner"
      aria-label="Cookie同意"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-gray-300 flex-1">
          当サイトでは、サービス改善のためにGoogle Analyticsを使用しています。
          Cookieの使用に同意いただける場合は「同意する」をクリックしてください。
          詳しくは
          <Link href="/privacy" className="text-blue-400 hover:text-blue-300 underline ml-1">
            プライバシーポリシー
          </Link>
          をご覧ください。
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handleConsent('denied')}
            className="cursor-pointer px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
          >
            拒否する
          </button>
          <button
            onClick={() => handleConsent('granted')}
            className="cursor-pointer px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            同意する
          </button>
        </div>
      </div>
    </div>
  )
}
