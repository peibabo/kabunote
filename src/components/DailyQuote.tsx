'use client'

import { getTodayQuote } from '@/lib/quotes'

export default function DailyQuote() {
  const quote = getTodayQuote()

  return (
    <div
      className="relative bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg px-5 py-4 animate-fade-in"
      style={{
        borderLeftWidth: '2px',
        borderLeftColor: 'rgb(59, 130, 246)',
        boxShadow: '−2px 0 8px rgba(59, 130, 246, 0.3)',
      }}
    >
      <p className="text-gray-300 italic text-sm leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <p className="text-gray-500 text-xs mt-1.5 text-right">
        &mdash; {quote.author}
      </p>
    </div>
  )
}
