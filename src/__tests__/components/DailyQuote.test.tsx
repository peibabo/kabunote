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

  it('意味テキストが存在する', () => {
    render(<DailyQuote />)
    expect(screen.getByText('無理に売買せず様子を見るのも立派な戦略')).toBeInTheDocument()
  })

  it('ホバー前はツールチップが非表示（opacity-0）', () => {
    render(<DailyQuote />)
    const tooltip = screen.getByText('無理に売買せず様子を見るのも立派な戦略').closest('div')!.parentElement!
    expect(tooltip.className).toContain('opacity-0')
  })

  it('ホバー時にツールチップが表示（opacity-100）になる', () => {
    render(<DailyQuote />)
    const card = screen.getByText(/休むも相場/).closest('.relative')!
    fireEvent.mouseEnter(card)
    const tooltip = screen.getByText('無理に売買せず様子を見るのも立派な戦略').closest('div')!.parentElement!
    expect(tooltip.className).toContain('opacity-100')
  })
})
