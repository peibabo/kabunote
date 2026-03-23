import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BasicTab from '@/components/stock-tabs/BasicTab'

describe('BasicTab', () => {
  const defaultProps = {
    symbol: '7203',
    memo: 'テストメモ',
    onMemoChange: vi.fn(),
    onMemoModalOpen: vi.fn(),
    per: '',
    pbr: '',
    fairPer: '',
    fairPbr: '',
    currentPrice: '',
    onPerChange: vi.fn(),
    onPbrChange: vi.fn(),
    onFairPerChange: vi.fn(),
    onFairPbrChange: vi.fn(),
  }

  it('メモテキストエリアを表示する', () => {
    render(<BasicTab {...defaultProps} />)
    expect(screen.getByDisplayValue('テストメモ')).toBeInTheDocument()
  })

  it('メモ入力時にonMemoChangeが呼ばれる', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<BasicTab {...defaultProps} onMemoChange={onChange} memo="" />)

    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'a')
    expect(onChange).toHaveBeenCalled()
  })

  it('保存中の表示', () => {
    render(<BasicTab {...defaultProps} isMemoSaving={true} />)
    expect(screen.getByText(/保存中/)).toBeInTheDocument()
  })

  it('エラー表示', () => {
    render(<BasicTab {...defaultProps} memoError="保存に失敗" />)
    expect(screen.getByText(/保存に失敗/)).toBeInTheDocument()
  })
})
