'use client'

import { useState, useEffect } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import { STORAGE_KEYS } from '@/lib/storageKeys'
import { APP_EVENTS } from '@/lib/appEvents'

export default function GoogleAnalyticsWrapper({ gaId }: { gaId: string }) {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const check = () => {
      setGranted(localStorage.getItem(STORAGE_KEYS.COOKIE_CONSENT) === 'granted')
    }
    check()

    window.addEventListener(APP_EVENTS.COOKIE_CONSENT_CHANGE, check)
    return () => window.removeEventListener(APP_EVENTS.COOKIE_CONSENT_CHANGE, check)
  }, [])

  if (!granted) return null

  return <GoogleAnalytics gaId={gaId} />
}
