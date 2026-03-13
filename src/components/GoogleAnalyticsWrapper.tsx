'use client'

import { useState, useEffect } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { STORAGE_KEYS } from '@/lib/storageKeys'

export default function GoogleAnalyticsWrapper({ gaId }: { gaId: string }) {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const check = () => {
      setGranted(localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT) === 'granted')
    }
    check()

    window.addEventListener('cookie-consent-change', check)
    return () => window.removeEventListener('cookie-consent-change', check)
  }, [])

  if (!granted) return null

  return <GoogleAnalytics gaId={gaId} />
}
