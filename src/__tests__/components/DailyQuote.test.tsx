import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DailyQuote from '@/components/DailyQuote'

vi.mock('@/lib/quotes', () => ({
  getTodayQuote: () => ({
    text: '休むも相場',
    author: '日本相場格言',
    meaning: '無理に売買せず様子を見るのも立派な戦略',
  }),
}))

describe('DailyQuote', () => {
  it('格言テキストと出典が表示される', () => {
    render(<DailyQuote />)
    expect(screen.getByText(/休むも相場/)).toBeInTheDocument()
    expect(screen.getByText(/日本相場格言/)).toBeInTheDocument()
  })

  it('ホバー時に意味がツールチップで表示される', () => {
    render(<DailyQuote />)
    const card = screen.getByText(/休むも相場/).closest('div')!
    expect(screen.queryByText('無理に売買せず様子を見るのも立派な戦略')).not.toBeInTheDocument()
    fireEvent.mouseEnter(card)
    expect(screen.getByText('無理に売買せず様子を見るのも立派な戦略')).toBeInTheDocument()
    fireEvent.mouseLeave(card)
    expect(screen.queryByText('無理に売買せず様子を見るのも立派な戦略')).not.toBeInTheDocument()
  })
})
