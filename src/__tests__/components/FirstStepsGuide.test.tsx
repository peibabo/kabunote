import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import FirstStepsGuide from '@/components/dashboard/FirstStepsGuide'
import type { Position } from '@/types/positions'

vi.mock('@/lib/sound', () => ({ playSound: vi.fn() }))

const position = { id: 'p1', shares: 100, avgPrice: 1000 } as unknown as Position
const stock = (symbol: string, memo = '', positions: Position[] = []) => ({
  symbol,
  name: symbol === '7203' ? 'トヨタ自動車' : symbol,
  memo,
  positions,
})

const renderGuide = (overrides: Partial<Parameters<typeof FirstStepsGuide>[0]> = {}) => {
  const props = {
    stocks: [stock('7203')],
    hasCalendarData: false,
    onStockClick: vi.fn(),
    onOpenAddStock: vi.fn(),
    ...overrides,
  }
  render(<FirstStepsGuide {...props} />)
  return props
}

describe('FirstStepsGuide', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('銘柄1件だけのとき進捗 1/4 と案内先の銘柄名を表示', () => {
    renderGuide()
    expect(screen.getByText('🚀 はじめの一歩')).toBeDefined()
    expect(screen.getByText('1 / 4 完了')).toBeDefined()
    expect(screen.getByText('トヨタ自動車')).toBeDefined()
  })

  it('銘柄0件では表示しない', () => {
    renderGuide({ stocks: [] })
    expect(screen.queryByText('🚀 はじめの一歩')).toBeNull()
  })

  it('全ステップ完了なら表示しない', () => {
    renderGuide({ stocks: [stock('7203', 'メモ', [position]), stock('6758')] })
    expect(screen.queryByText('🚀 はじめの一歩')).toBeNull()
  })

  it('「メモを書く」で基本タブに切り替えてカードへ移動し、メモ欄にフォーカス', () => {
    vi.useFakeTimers()
    const textarea = document.createElement('textarea')
    textarea.id = 'memo-7203'
    document.body.appendChild(textarea)

    const props = renderGuide()
    fireEvent.click(screen.getByText('メモを書く'))
    expect(localStorage.getItem('kabunote-active-tab-7203')).toBe('basic')

    act(() => { vi.advanceTimersByTime(200) })
    expect(props.onStockClick).toHaveBeenCalledWith('7203')
    expect(document.activeElement).toBe(textarea)
    textarea.remove()
  })

  it('「保有株を登録」で管理タブの保有状況を開く', () => {
    vi.useFakeTimers()
    const props = renderGuide()
    fireEvent.click(screen.getByText('保有株を登録'))
    expect(localStorage.getItem('kabunote-active-tab-7203')).toBe('management')
    expect(localStorage.getItem('kabunote-management-tab-7203')).toBe('positions')
    act(() => { vi.advanceTimersByTime(200) })
    expect(props.onStockClick).toHaveBeenCalledWith('7203')
  })

  it('「決算日を登録」で管理タブのイベントを開く', () => {
    renderGuide()
    fireEvent.click(screen.getByText('決算日を登録'))
    expect(localStorage.getItem('kabunote-management-tab-7203')).toBe('events')
  })

  it('「銘柄を追加」で追加ダイアログを開く', () => {
    const props = renderGuide()
    fireEvent.click(screen.getByText('銘柄を追加'))
    expect(props.onOpenAddStock).toHaveBeenCalled()
  })

  it('完了済みステップにはアクションボタンを出さない', () => {
    renderGuide({ stocks: [stock('7203', 'メモあり')] })
    expect(screen.queryByText('メモを書く')).toBeNull()
    expect(screen.getByText('2 / 4 完了')).toBeDefined()
  })

  it('✕で閉じると非表示になり、再表示されない', () => {
    renderGuide()
    fireEvent.click(screen.getByLabelText('ガイドを閉じる'))
    expect(screen.queryByText('🚀 はじめの一歩')).toBeNull()
    expect(localStorage.getItem('kabunote-first-steps-dismissed')).toBe('1')
  })

  it('閉じた状態が保存されていれば最初から表示しない', () => {
    localStorage.setItem('kabunote-first-steps-dismissed', '1')
    renderGuide()
    expect(screen.queryByText('🚀 はじめの一歩')).toBeNull()
  })
})
