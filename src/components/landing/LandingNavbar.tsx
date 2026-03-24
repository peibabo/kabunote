'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { href: '#features', label: '機能紹介' },
  { href: '#daily', label: '毎日の習慣' },
  { href: '#how-it-works', label: '使い方' },
  { href: '#why-kabunote', label: '特徴' },
  { href: '#faq', label: 'FAQ' },
  { href: '/blog', label: 'ブログ' },
]

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
              style={{ width: 'auto', height: 'auto', filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm hover:scale-105"
            >
              無料で始める
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white"
              aria-label="メニュー"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-700/50 pt-4">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) =>
                link.href.startsWith('#') ? (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="text-gray-300 hover:text-white transition-colors text-sm font-medium py-2"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm text-center"
              >
                無料で始める
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
