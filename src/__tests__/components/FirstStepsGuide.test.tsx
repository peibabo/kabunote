import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import FirstStepsGuide from '@/components/dashboard/FirstStepsGuide'
import type { Position } from '@/types/positions'

vi.mock('@/lib/sound', () => ({ playSound: vi.fn() }))
vi.mock('@/lib/gamification', () => ({ grantXp: vi.fn() }))

const position = { id: 'p1', shares: 100, avgPrice: 1000 } as unknown as Position
const stock = (symbol: string, memo = '', positions: Position[] = [], currentPrice: number | null = null) => ({
  symbol,
  name: symbol === '7203' ? 'トヨタ自動車' : symbol,
  memo,
  positions,
  currentPrice,
})

const renderGuide = (overrides: Partial<Parameters<typeof FirstStepsGuide>[0]> = {}) => {
  const props = {
    stocks: [stock('7203')],
    hasCalendarData: false,
    hasSnapshot: false,
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
    renderGuide({ stocks: [stock('7203', 'メモ', [position], 3000), stock('6758')], hasSnapshot: true })
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

  describe('今日の株価を入れて記録', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('保有株があって株価未入力なら「株価を入力」で分析タブの株価欄へフォーカス', () => {
      vi.useFakeTimers()
      const input = document.createElement('input')
      input.id = 'current-price-7203'
      document.body.appendChild(input)

      const props = renderGuide({ stocks: [stock('7203', 'メモ', [position])] })
      expect(screen.getByText('3 / 5 完了')).toBeDefined()
      expect(screen.getByText(/株価は自動では更新されません/)).toBeDefined()
      expect(screen.queryByText('📸 今日の記録をする')).toBeNull()

      fireEvent.click(screen.getByText('株価を入力'))
      expect(localStorage.getItem('kabunote-active-tab-7203')).toBe('analysis')
      expect(localStorage.getItem('kabunote-investment-tab-7203')).toBe('analysis')

      act(() => { vi.advanceTimersByTime(200) })
      expect(props.onStockClick).toHaveBeenCalledWith('7203')
      expect(document.activeElement).toBe(input)
      input.remove()
    })

    it('株価入力済みなら「今日の記録をする」でスナップショットを作成し、完了メッセージを出す', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
      vi.stubGlobal('fetch', fetchMock)
      const onCreated = vi.fn()
      window.addEventListener('kabunote-snapshot-created', onCreated)

      renderGuide({ stocks: [stock('7203', 'メモ', [position], 3000), stock('6758')] })
      expect(screen.queryByText('株価を入力')).toBeNull()
      fireEvent.click(screen.getByText('📸 今日の記録をする'))

      expect(await screen.findByText('✅ 今日の記録ができました！')).toBeDefined()
      expect(fetchMock).toHaveBeenCalledWith('/api/portfolio/snapshot', { method: 'POST' })
      expect(onCreated).toHaveBeenCalled()
      window.removeEventListener('kabunote-snapshot-created', onCreated)
    })

    it('記録に失敗したらエラーを表示し、ステップは未完了のまま', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ message: 'ポジションが設定されていません' }),
      }))
      renderGuide({ stocks: [stock('7203', 'メモ', [position], 3000)] })
      fireEvent.click(screen.getByText('📸 今日の記録をする'))
      expect(await screen.findByText('ポジションが設定されていません')).toBeDefined()
      expect(screen.getByText('📸 今日の記録をする')).toBeDefined()
    })

    it('他の場所（フローティングボタン等）で記録されたらステップを完了にする', () => {
      renderGuide({ stocks: [stock('7203', 'メモ', [position], 3000)] })
      expect(screen.getByText('3 / 5 完了')).toBeDefined()
      act(() => { window.dispatchEvent(new CustomEvent('kabunote-snapshot-created')) })
      expect(screen.getByText('4 / 5 完了')).toBeDefined()
    })

    it('未保有なら記録ステップは出ない', () => {
      renderGuide({ stocks: [stock('7203', 'メモ')] })
      expect(screen.getByText('2 / 4 完了')).toBeDefined()
      expect(screen.queryByText('📸 今日の株価を入れて記録')).toBeNull()
    })
  
    it('株価が入ると「株価を入力」から「今日の記録をする」に切り替わり、「株価を更新」も残る', () => {
      const base = {
        hasCalendarData: false, hasSnapshot: false, onStockClick: vi.fn(), onOpenAddStock: vi.fn(),
      }
      const { rerender } = render(
        <FirstStepsGuide {...base} stocks={[stock('7203', 'メモ', [position])]} />
      )
      expect(screen.getByText('株価を入力')).toBeDefined()
      expect(screen.queryByText('📸 今日の記録をする')).toBeNull()

      rerender(<FirstStepsGuide {...base} stocks={[stock('7203', 'メモ', [position], 3000)]} />)
      expect(screen.queryByText('株価を入力')).toBeNull()
      expect(screen.getByText('株価を更新')).toBeDefined()
      expect(screen.getByText('📸 今日の記録をする')).toBeDefined()
    })

    it('記録ステップだけが残っている既存ユーザーには毎日の使い方として案内する', () => {
      renderGuide({ stocks: [stock('7203', 'メモ', [position], 3000), stock('6758')] })
      expect(screen.getByText('4 / 5 完了')).toBeDefined()
      expect(screen.getByText(/あと1つ！/)).toBeDefined()
    })

    it('最後の記録で全完了しても「記録できました」パネルを出し、✕で閉じられる', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }))
      renderGuide({ stocks: [stock('7203', 'メモ', [position], 3000), stock('6758')] })
      fireEvent.click(screen.getByText('📸 今日の記録をする'))
      expect(await screen.findByText('✅ 今日の記録ができました！')).toBeDefined()
      expect(screen.queryByText('🚀 はじめの一歩')).toBeNull()
      fireEvent.click(screen.getByLabelText('閉じる'))
      expect(screen.queryByText('✅ 今日の記録ができました！')).toBeNull()
    })
})
})
