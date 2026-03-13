'use client'

import { useState } from 'react'
import { getTodayQuote } from '@/lib/quotes'

export default function DailyQuote() {
  const quote = getTodayQuote()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg px-5 py-4 animate-fade-in cursor-default"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: 'rgb(59, 130, 246)',
        boxShadow: '-2px 0 8px rgba(59, 130, 246, 0.3)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p className="text-gray-300 italic text-sm leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-gray-500 text-xs mt-1.5 text-right">
        &mdash; {quote.author}
      </p>
      {isHovered && (
        <div
          className="absolute left-0 right-0 top-full mt-1 mx-2 p-3 rounded-lg border bg-blue-900/95 border-blue-500/50 text-gray-200 text-xs leading-relaxed z-50 pointer-events-none"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          }}
        >
          {quote.meaning}
        </div>
      )}
    </div>
  )
}
