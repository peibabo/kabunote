'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function BlogNavbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/kabunote-logo.png"
              alt="カブノオト"
              width={150}
              height={48}
              className="h-10 md:h-12 w-auto"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }}
            />
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/blog"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
            >
              ブログ
            </Link>
            <Link
              href="/help"
              className="text-gray-300 hover:text-white transition-colors text-sm font-medium hidden md:inline-block"
            >
              ヘルプ
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm hover:scale-105"
            >
              無料で始める
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
