import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PriceInputNudge, { shouldShowPriceNudge } from '@/components/stock/PriceInputNudge'

vi.mock('@/lib/sound', () => ({ playSound: vi.fn() }))

describe('PriceInputNudge', () => {
  afterEach(() => {
    vi.useRealTimers()
    localStorage.clear()
  })

  it('株価が自動更新されないことを伝える', () => {
    render(<PriceInputNudge symbol="7203" />)
    expect(screen.getByText(/株価は自動で更新されない/)).toBeDefined()
  })

  it('「株価を入力」で分析タブ→分析サブタブに切り替え、株価欄にフォーカス', () => {
    vi.useFakeTimers()
    const input = document.createElement('input')
    input.id = 'current-price-7203'
    document.body.appendChild(input)

    render(<PriceInputNudge symbol="7203" />)
    fireEvent.click(screen.getByText('株価を入力'))
    expect(localStorage.getItem('kabunote-active-tab-7203')).toBe('analysis')
    expect(localStorage.getItem('kabunote-investment-tab-7203')).toBe('analysis')

    act(() => { vi.advanceTimersByTime(200) })
    expect(document.activeElement).toBe(input)
    input.remove()
  })

  it('✕で閉じると銘柄ごとに非表示が保存される', () => {
    const { unmount } = render(<PriceInputNudge symbol="7203" />)
    fireEvent.click(screen.getByLabelText('株価未入力の案内を閉じる'))
    expect(screen.queryByText('株価を入力')).toBeNull()
    expect(localStorage.getItem('kabunote-price-nudge-dismissed-7203')).toBe('1')
    unmount()

    render(<PriceInputNudge symbol="7203" />)
    expect(screen.queryByText('株価を入力')).toBeNull()
    render(<PriceInputNudge symbol="6758" />)
    expect(screen.getByText('株価を入力')).toBeDefined()
  })

  describe('shouldShowPriceNudge', () => {
    it('保有あり・株価未入力・分析タブ以外で表示', () => {
      expect(shouldShowPriceNudge(100, '', 'basic')).toBe(true)
      expect(shouldShowPriceNudge(100, '0', 'management')).toBe(true)
    })
    it('保有0・株価入力済み・分析タブ表示中は出さない', () => {
      expect(shouldShowPriceNudge(0, '', 'basic')).toBe(false)
      expect(shouldShowPriceNudge(100, '3000', 'basic')).toBe(false)
      expect(shouldShowPriceNudge(100, '', 'analysis')).toBe(false)
    })
  })
})
