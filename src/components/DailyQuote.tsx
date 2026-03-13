'use client'

import { useState } from 'react'
import { getTodayQuote } from '@/lib/quotes'

export default function DailyQuote() {
  const quote = getTodayQuote()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg px-5 py-2.5 animate-fade-in cursor-default"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: 'rgb(59, 130, 246)',
        boxShadow: '-2px 0 8px rgba(59, 130, 246, 0.3)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip - 上に表示 */}
      <div
        className={`
          absolute left-4 right-4 bottom-full mb-2 z-50 pointer-events-none
          transition-all duration-300 ease-out
          ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        <div
          className="relative px-4 py-3 rounded-lg backdrop-blur-md text-gray-200 text-xs leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 58, 108, 0.9), rgba(55, 48, 107, 0.85))',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.2)',
          }}
        >
          {quote.meaning}
          {/* 下向き三角 */}
          <div
            className="absolute left-6 -bottom-1.5 w-3 h-3 rotate-45"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(30, 58, 108, 0.9) 50%)',
              borderRight: '1px solid rgba(59, 130, 246, 0.5)',
              borderBottom: '1px solid rgba(59, 130, 246, 0.5)',
            }}
          />
        </div>
      </div>

      <p className="text-gray-300 italic text-sm leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-gray-500 text-xs mt-1 text-right">
        &mdash; {quote.author}
      </p>

    </div>
  )
}
