import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DailyQuote from '@/components/DailyQuote'

vi.mock('@/lib/quotes', () => ({
  getTodayQuote: () => ({
    text: '休むも相場',
    author: '日本相場格言',
  }),
}))

describe('DailyQuote', () => {
  it('格言テキストと出典が表示される', () => {
    render(<DailyQuote />)
    expect(screen.getByText(/休むも相場/)).toBeInTheDocument()
    expect(screen.getByText(/日本相場格言/)).toBeInTheDocument()
  })
})
