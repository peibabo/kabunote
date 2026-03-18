import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MemoTemplateSelector from '@/components/stock-tabs/MemoTemplateSelector'
import { MEMO_TEMPLATES } from '@/types/memoTemplates'

vi.mock('@/lib/sound', () => ({
  playSound: vi.fn(),
}))

describe('MemoTemplateSelector', () => {
  const defaultProps = {
    onSelect: vi.fn(),
    currentMemo: '',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('テンプレートボタンを表示する', () => {
    render(<MemoTemplateSelector {...defaultProps} />)
    expect(screen.getByText(/テンプレート/)).toBeInTheDocument()
  })

  it('ボタンクリックでテンプレート一覧を表示する', async () => {
    const user = userEvent.setup()
    render(<MemoTemplateSelector {...defaultProps} />)

    await user.click(screen.getByText(/テンプレート/))

    for (const t of MEMO_TEMPLATES) {
      expect(screen.getByText(t.name)).toBeInTheDocument()
    }
  })

  it('空メモ時にテンプレート選択で即挿入する', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<MemoTemplateSelector onSelect={onSelect} currentMemo="" />)

    await user.click(screen.getByText(/テンプレート/))
    await user.click(screen.getByText('ファンダメンタル分析'))

    expect(onSelect).toHaveBeenCalledWith(MEMO_TEMPLATES[0].content)
  })

  it('既存メモ時に確認UIを表示する', async () => {
    const user = userEvent.setup()
    render(<MemoTemplateSelector onSelect={vi.fn()} currentMemo="既存メモ" />)

    await user.click(screen.getByText(/テンプレート/))
    await user.click(screen.getByText('ファンダメンタル分析'))

    expect(screen.getByText('既存のメモがあります')).toBeInTheDocument()
    expect(screen.getByText('末尾に追加')).toBeInTheDocument()
    expect(screen.getByText('上書き')).toBeInTheDocument()
  })

  it('末尾に追加で既存メモ+テンプレートが渡される', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<MemoTemplateSelector onSelect={onSelect} currentMemo="既存メモ" />)

    await user.click(screen.getByText(/テンプレート/))
    await user.click(screen.getByText('ファンダメンタル分析'))
    await user.click(screen.getByText('末尾に追加'))

    expect(onSelect).toHaveBeenCalledWith('既存メモ\n\n' + MEMO_TEMPLATES[0].content)
  })

  it('上書きでテンプレートのみが渡される', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<MemoTemplateSelector onSelect={onSelect} currentMemo="既存メモ" />)

    await user.click(screen.getByText(/テンプレート/))
    await user.click(screen.getByText('ファンダメンタル分析'))
    await user.click(screen.getByText('上書き'))

    expect(onSelect).toHaveBeenCalledWith(MEMO_TEMPLATES[0].content)
  })

  it('戻るボタンでテンプレート一覧に戻る', async () => {
    const user = userEvent.setup()
    render(<MemoTemplateSelector onSelect={vi.fn()} currentMemo="既存メモ" />)

    await user.click(screen.getByText(/テンプレート/))
    await user.click(screen.getByText('ファンダメンタル分析'))
    expect(screen.getByText('既存のメモがあります')).toBeInTheDocument()

    await user.click(screen.getByText('戻る'))
    // テンプレート一覧に戻る
    expect(screen.getByText('ファンダメンタル分析')).toBeInTheDocument()
    expect(screen.queryByText('既存のメモがあります')).not.toBeInTheDocument()
  })

  it('2000文字超過時に末尾追加で警告を表示する', async () => {
    const user = userEvent.setup()
    const longMemo = 'あ'.repeat(1990)
    render(<MemoTemplateSelector onSelect={vi.fn()} currentMemo={longMemo} />)

    await user.click(screen.getByText(/テンプレート/))
    await user.click(screen.getByText('ファンダメンタル分析'))
    await user.click(screen.getByText('末尾に追加'))

    expect(screen.getByText(/2000文字を超える/)).toBeInTheDocument()
  })
})
