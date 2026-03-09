import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchBar from '@/components/SearchBar'

describe('SearchBar', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('検索入力を表示する', () => {
    render(
      <SearchBar searchQuery="" onSearchChange={vi.fn()} />
    )
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('placeholderを表示する', () => {
    render(
      <SearchBar searchQuery="" onSearchChange={vi.fn()} placeholder="銘柄を検索" />
    )
    expect(screen.getByPlaceholderText('銘柄を検索')).toBeInTheDocument()
  })

  it('入力時に内部ステートが更新される', () => {
    const onChange = vi.fn()
    render(
      <SearchBar searchQuery="" onSearchChange={onChange} />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'トヨタ' } })
    expect(screen.getByDisplayValue('トヨタ')).toBeInTheDocument()
  })

  it('初期値が表示される', () => {
    render(
      <SearchBar searchQuery="テスト" onSearchChange={vi.fn()} />
    )
    expect(screen.getByDisplayValue('テスト')).toBeInTheDocument()
  })
})
